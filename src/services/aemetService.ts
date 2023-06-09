import { AemetModel } from "../models/aemetModel";
import { Dia, PeriodoValor, PrediccionHoraria, Weather } from "../models/prediccionHorariaModel";
import { UtilService } from "./utilService";

const https = require('https');



export class AemetService{

    private location = process.env.location;
    private apiKey = process.env.apiKey;
    private avisoTormenta = process.env.avisoTormenta;
    private avisoPrecipitacion = process.env.avisoPrecipitacion;
    private avisoNieve = process.env.avisoNieve;

    

    private getHourlyForecast(): Promise<AemetModel>{
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
                UtilService.log('There is an error: '+err);
            });
        });
    }

    async getDataHourlyForecast(): Promise<PrediccionHoraria[]> {
        let aemetModel =  await this.getHourlyForecast();
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
                UtilService.log('There is an error: '+err);
            });
        });
    }

     getForecastToday(forecasts: PrediccionHoraria[]): Dia | undefined{
        let today = UtilService.getToday();
        for(let i=0;i!=forecasts.length;i++){
            let forecast = forecasts[i].prediccion;
            for(let j=0;j!=forecast.dia.length;j++){
                let forecasDate = UtilService.removeHours(forecast.dia[j].fecha.toString());
                if(today==forecasDate){
                    return forecast.dia[j];
                }
            }
        }
        return undefined;
    }

    evaluateForecasts(forecast: Dia): string{
        let resRain = this.evaluatePeriodValue(forecast.probPrecipitacion, Weather.Rain);
        let resStorm = this.evaluatePeriodValue(forecast.probTormenta, Weather.Storm);
        let resSnow = this.evaluatePeriodValue(forecast.probNieve, Weather.Snow);
        let hashMap = this.groupForecasts(resRain, resStorm, resSnow);
        let text = this.generateText(hashMap);
        return text;
    }

    private groupForecasts(periodRain: PeriodoValor[], periodStorm: PeriodoValor[], periodSnow: PeriodoValor[]): Map<string, string>{
        let hashMap = new Map<string, string>();
        for(let i=0;i!=periodRain.length;i++){
            hashMap.set(periodRain[i].periodo,`P${periodRain[i].value}`);
        }
        for(let i=0;i!=periodStorm.length;i++){
            if(hashMap.has(periodStorm[i].periodo)){
                let val = hashMap.get(periodStorm[i].periodo);
                hashMap.set(periodStorm[i].periodo, val+`,T${periodStorm[i].value}`);
            }else{
                hashMap.set(periodStorm[i].periodo,`T${periodStorm[i].value}`);
            }
        }
        for(let i=0;i!=periodSnow.length;i++){
            if(hashMap.has(periodSnow[i].periodo)){
                let val = hashMap.get(periodSnow[i].periodo);
                hashMap.set(periodSnow[i].periodo, val+`,N${periodSnow[i].value}`);
            }else{
                hashMap.set(periodSnow[i].periodo,`,N${periodSnow[i].value}`);
            }
        }
        return hashMap;
    }

    private generateText(hashMap: Map<string, string>): string{
        let msg = '';
        hashMap.forEach((hState, hPeriod) =>{
            let period = this.splitPeriod(hPeriod);
            msg = msg + `❗ De ${period[0]}:00 a ${period[1]}:00, hay un ${this.generateState(hState)}\n\n`;
        });
        return msg;
    }

    private generateState(state:string){
        let arState = state.split(',');
        let result = '';
        for(let i=0;i!=arState.length;i++){
            let s =arState[i];
            let percentage = s.substring(1,s.length);
            let weather = s.substring(0,1);
            result = result + `${percentage}% de probabilidad de ${this.getState(weather)}${this.getConjuncion(arState.length,i)} `;
        }
        return result;
    }

    private getConjuncion(total:number, pos:number):string{
        if(total == 2 && pos == 0){
            return ' y un';
        }
        if(total == 3 && pos==0){
            return ',';
        }
        if(total == 3 && pos==1){
            return ' y un';
        }
        return '';
    }
    
    private splitPeriod(period: string): string[]{
        let res: string[] =[];
        res.push(period.substring(0,2));
        res.push(period.substring(2,4));
        return res;
    }


    private getState(state :string):string{
        let res ='';
        if(state=='P'){
            res = 'lluvia 🌧';
        }
        if(state == 'T'){
            res = 'tormenta ⛈'
        }
        if(state == 'N'){
            res = 'nieve ❄';
        }
        return res;
    }

    private evaluatePeriodValue(periodValue: PeriodoValor[], weather: Weather): PeriodoValor[]{
        let result: PeriodoValor[]=[];
        for(let i=0;i!=periodValue.length;i++){
            if(this.isPeriodValid(periodValue[i].periodo)){
                if(weather == Weather.Rain){
                    if(this.compareThresholdValue(periodValue[i].value, this.avisoPrecipitacion)){
                        result.push(periodValue[i]);
                    }
                }
                if(weather == Weather.Storm){
                    if(this.compareThresholdValue(periodValue[i].value, this.avisoTormenta)){
                        result.push(periodValue[i]);
                    }
                }
                if(weather == Weather.Snow){
                    if(this.compareThresholdValue(periodValue[i].value, this.avisoNieve)){
                        result.push(periodValue[i]);
                    }
                }
            }
        }
        return result;
    }


    private compareThresholdValue(value: string, threshold: string | undefined): boolean{
        let valueNum = Number.parseInt(value);
        let thresholdNum = 5;
        if(threshold!=undefined){
            thresholdNum = Number.parseInt(threshold);
        }

        if(valueNum>=thresholdNum){
            return true;
        }
        return false;
    }

    private isPeriodValid(period: string): boolean{
        let currentHour = UtilService.getCurrentHour();
        let initPeriod = Number.parseInt(period.substring(0,2));
        let endPeriod = Number.parseInt(period.substring(2,4));
        if(initPeriod<=currentHour && endPeriod>currentHour){
            return true;
        }
        if(initPeriod>currentHour){
            return true;
        }
        if(endPeriod==2){
            return true;
        }
        return false;
    }

}

