
export class UtilService{

    private static getDateTime():string{
        let now = new Date();
        return `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    }

    static logTextUser(text: string): void{
        text=text.trim();
        text = text.replace('\n','');
        let ar = text.split('❗');
        for(let i=0;i!=ar.length;i++){
          let t = ar[i].trim();
          if(t!=''){
            console.log(`[${this.getDateTime()}] -> ${t}`);
          }
        }
    }

    static log(text:string){
        console.log(`[${this.getDateTime()}] -> ${text}`);
    }

    //
    static getCurrentHour(): number{
        let today = new Date();
        return today.getHours();
    }

    static getToday(): string{
        const today = new Date();
        let month =today.getMonth()+1;
        let monthStr='';
        if(month <=9){
            monthStr=`0${month}`
        }else{
            monthStr=`${month}`;
        }
        let day = today.getDate();
        let dayStr='';
        if(day <=9){
            dayStr=`0${day}`;
        }else{
            dayStr=`${day}`
        }
        return `${today.getFullYear()}-${monthStr}-${dayStr}`;
    }

    static removeHours(date: string):string{
        let ar=date.split('T');
        return ar[0];
    }
}