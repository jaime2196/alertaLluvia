import { AemetService } from "./services/aemetService";
import { sendMessage } from "./services/telegramService";
import dotenv from "dotenv"

dotenv.config()

  function main(){
    let cronJob = require('cron').CronJob;
    let ultimoEstado= new Date();
    let aemetService = new AemetService();
    console.log('Se programa cron');
    var myJob = new cronJob('*/10 * * * *', async function(){
      let prediccionHoraria = await aemetService.getDatosPredicionHoraria();
      console.log(`${ultimoEstado}----- ${prediccionHoraria[0].elaborado}`);
      if(ultimoEstado != prediccionHoraria[0].elaborado){
        ultimoEstado = prediccionHoraria[0].elaborado;
        let prediccionHoy =aemetService.getPrediccionHoy(prediccionHoraria);
        if(prediccionHoy!=undefined){
          let texto = aemetService.evaluarPredicciones(prediccionHoy);
          console.log(texto);
          if(texto != undefined && texto!=''){
            sendMessage(texto);
          }
        }
      }
      console.log("cron ran")
    });
    myJob.start();
  }

  main();


