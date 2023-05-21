import { AemetModel } from "../models/aemetModel";
import { Dia, PeriodoValor, PrediccionHoraria, Tiempo } from "../models/prediccionHorariaModel";

const https = require('https');



export class AemetService{

    private location = process.env.location;
    private apiKey = process.env.apiKey;
    private avisoTormenta = process.env.avisoTormenta;
    private avisoPrecipitacion = process.env.avisoPrecipitacion;
    private avisoNieve = process.env.avisoNieve;

    

    private getPredicionHoraria(): Promise<AemetModel>{
        const options = {
            hostname: 'opendata.aemet.es',
            path: `/opendata/api/prediccion/especifica/municipio/horaria/${this.location}`,
            headers: {
                accept: 'application/json',
                api_key: this.apiKey
            }
        }
        return new Promise((resolve, reject)=>{
            https.get(options, (res: any)=>{
                let data='';
                res.on('data', (chunk: any)=>{
                    data = data +chunk;
                });
                res.on('end',()=>{
                    resolve(JSON.parse(data));
                });
            }).on('error', (err: any)=>{
                console.log('Se ha producido un error: '+err);
            });
        });
    }

    async getDatosPredicionHoraria(): Promise<PrediccionHoraria[]> {
        let aemetModel =  await this.getPredicionHoraria();
        let url = new URL(aemetModel.datos);
        const options = {
            hostname: url.hostname,
            path: url.pathname
        };
        return new Promise((resolve, reject)=>{
            https.get(options, (res: any)=>{
                let data='';
                res.on('data', (chunk: any)=>{
                    data = data +chunk;
                });
                res.on('end',()=>{
                    resolve(JSON.parse(data));
                });
            }).on('error', (err: any)=>{
                console.log('Se ha producido un error: '+err);
            });
        });
    }

     getPrediccionHoy(predicciones: PrediccionHoraria[]): Dia | undefined{
        let hoy = this.getDiaActual();
        for(let i=0;i!=predicciones.length;i++){
            let prediccion = predicciones[i].prediccion;
            for(let j=0;j!=prediccion.dia.length;j++){
                let fechaPrediccion =this.eliminarHorasFecha(prediccion.dia[j].fecha.toString());
                if(hoy==fechaPrediccion){
                    return prediccion.dia[j];
                }
            }
        }
        return undefined;
    }

    private getDiaActual(): string{
        const hoy = new Date();
        let mes =hoy.getMonth()+1;
        let mesStr='';
        if(mes <=9){
            mesStr=`0${mes}`
        }else{
            mesStr=`${mes}`;
        }
        let dia = hoy.getDate();
        let diaStr='';
        if(dia <=9){
            diaStr=`0${dia}`;
        }else{
            diaStr=`${dia}`
        }
        return `${hoy.getFullYear()}-${mesStr}-${diaStr}`;
    }

    private eliminarHorasFecha(fecha: string):string{
        let ar=fecha.split('T');
        return ar[0];
    }

    evaluarPredicciones(prediccion: Dia): string{
        let resPrep = this.evaluarPeriodoValor(prediccion.probPrecipitacion, Tiempo.Precipitacion);
        //console.log(resPrep);
        let resTormenta = this.evaluarPeriodoValor(prediccion.probTormenta, Tiempo.Tormenta);
        //console.log(resTormenta);
        let resNieve = this.evaluarPeriodoValor(prediccion.probNieve, Tiempo.Nieve);
        //console.log(resNieve);
        let hashMap = this.agruparPredicciones(resPrep, resTormenta, resNieve);
        let texto = this.generarTexto(hashMap);
        return texto;
    }

    private agruparPredicciones(periodoPrep: PeriodoValor[], periodoTorm: PeriodoValor[], periodoNiev: PeriodoValor[]): Map<string, string>{
        let hashMap = new Map<string, string>();
        for(let i=0;i!=periodoPrep.length;i++){
            hashMap.set(this.periodoToStr(periodoPrep[i]),'P');
        }
        for(let i=0;i!=periodoTorm.length;i++){
            if(hashMap.has(this.periodoToStr(periodoTorm[i]))){
                let val = hashMap.get(this.periodoToStr(periodoTorm[i]));
                hashMap.set(this.periodoToStr(periodoTorm[i]), val+'T')
            }else{
                hashMap.set(this.periodoToStr(periodoTorm[i]),'T')
            }
        }
        for(let i=0;i!=periodoNiev.length;i++){
            if(hashMap.has(this.periodoToStr(periodoNiev[i]))){
                let val = hashMap.get(this.periodoToStr(periodoNiev[i]));
                hashMap.set(this.periodoToStr(periodoNiev[i]), val+'T')
            }else{
                hashMap.set(this.periodoToStr(periodoNiev[i]),'T')
            }
        }
        //console.log(hashMap);
        return hashMap;
    }

    private generarTexto(hashMap: Map<string, string>): string{
        let msg = '';
        hashMap.forEach((tipo, prediccion) =>{
            let datos = prediccion.split('-');
            let periodo = this.separarPeriodo(datos[1]);
            msg = msg + `Hay un ${datos[0]} % de probabilidad de ${this.getTextoEstado(tipo)} entre las ${periodo[0]} y ${periodo[1]}\n`;
        });
        return msg;
    }
    
    private separarPeriodo(periodo: string): string[]{
        let res: string[] =[];
        res.push(periodo.substring(0,2));
        res.push(periodo.substring(2,4));
        return res;
    }

    private periodoToStr(periodo: PeriodoValor){
        return `${periodo.value}-${periodo.periodo}`;
    }
    
    private getTextoEstado(estado :string):string{
        let res = '';
        if(estado.length == 1){
            res = this.getEstado(estado);
        }
        if(estado.length == 2){
            res = `${this.getEstado(estado[0])} y ${this.getEstado(estado[1])}`
        }
        if(estado.length == 3){
            res = `${this.getEstado(estado[0])}, ${this.getEstado(estado[1])} y ${this.getEstado(estado[2])}`;
        }
        return res;
    }

    private getEstado(estado :string):string{
        let res ='';
        if(estado=='P'){
            res = 'lluvia';
        }
        if(estado == 'T'){
            res = 'tormenta'
        }
        if(estado == 'N'){
            res = 'nieve';
        }
        return res;
    }

    private evaluarPeriodoValor(periodoValor: PeriodoValor[], tiempo: Tiempo): PeriodoValor[]{
        let hora = this.getHoraActual();
        let result: PeriodoValor[]=[];
        for(let i=0;i!=periodoValor.length;i++){
            if(this.isPeriodoValido(hora, periodoValor[i].periodo)){
                if(tiempo == Tiempo.Precipitacion){
                    if(this.compararValorUmbral(periodoValor[i].value, this.avisoPrecipitacion)){
                        result.push(periodoValor[i]);
                    }
                }
                if(tiempo == Tiempo.Tormenta){
                    if(this.compararValorUmbral(periodoValor[i].value, this.avisoTormenta)){
                        result.push(periodoValor[i]);
                    }
                }
                if(tiempo == Tiempo.Nieve){
                    if(this.compararValorUmbral(periodoValor[i].value, this.avisoNieve)){
                        result.push(periodoValor[i]);
                    }
                }
            }
        }
        return result;
    }

    private getHoraActual(): number{
        let hoy = new Date();
        return hoy.getHours();
    }

    private compararValorUmbral(value: string, umbral: string | undefined): boolean{
        let valor = Number.parseInt(value);
        let unbralNum = 5;
        if(umbral!=undefined){
            unbralNum = Number.parseInt(umbral);
        }

        if(valor>=unbralNum){
            return true;
        }
        return false;
    }

    private isPeriodoValido(hora: number, periodo: string): boolean{
        let inicioPeriodo = Number.parseInt(periodo.substring(0,2));
        let finPeriodo = Number.parseInt(periodo.substring(2,4));
        if(hora>=inicioPeriodo && hora<finPeriodo){
            return true;
        }
        if(hora<=inicioPeriodo){
            return true;
        }
        return false;
    }

}

