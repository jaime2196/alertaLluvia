import { AemetService } from "./services/aemetService";
import { sendMessage } from "./services/telegramService";
import dotenv from "dotenv"
import { UtilService } from "./services/utilService";

dotenv.config()

  function main(){
    let cronJob = require('cron').CronJob;
    let lastGenerated = 'vacío';
    let aemetService = new AemetService();

    let configCron = process.env.configCron;
    var myJob = new cronJob(configCron, async function(){
      let hourlyForecast = await aemetService.getDataHourlyForecast();
      let elaborado = hourlyForecast[0].elaborado.toString();
      if(lastGenerated != elaborado){
        UtilService.log(`Aemet ha actualizado desde la última comprobación. Anterior: ${lastGenerated}, nuevo: ${elaborado} `);
        lastGenerated = elaborado;
        let forecastToday =aemetService.getForecastToday(hourlyForecast);
        if(forecastToday!=undefined){
          let text = aemetService.evaluateForecasts(forecastToday);
          if(text != undefined && text!=''){
            UtilService.logTextUser(text);
            sendMessage(text);
          }
        }
      }else{
        UtilService.log(`Aemet no ha actualizado desde la última comprobación (${lastGenerated})`);
      }
    }, null, null, null, null , true);

    myJob.start();
  }


  main();


