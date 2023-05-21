import { AemetService } from "./services/aemetService";
import { sendMessage } from "./services/telegramService";
import dotenv from "dotenv"

dotenv.config()

  function main(){
    let cronJob = require('cron').CronJob;
    let lastGenerated = new Date();
    let aemetService = new AemetService();

    var myJob = new cronJob('*/10 * * * *', async function(){
      let hourlyForecast = await aemetService.getDataHourlyForecast();
      if(lastGenerated != hourlyForecast[0].elaborado){
        lastGenerated = hourlyForecast[0].elaborado;
        let forecastToday =aemetService.getForecastToday(hourlyForecast);
        if(forecastToday!=undefined){
          let text = aemetService.evaluateForecasts(forecastToday);
          console.log(text);
          if(text != undefined && text!=''){
            sendMessage(text);
          }
        }
      }
    });

    myJob.start();
  }

  main();


