# AlertaLluvia
AlertaLluvia es un script escrito es [Typescript](https://www.typescriptlang.org/) que se ejecuta en [Node](https://nodejs.org/es).

Alerta lluvia usa [Open data](https://opendata.aemet.es/centrodedescargas/inicio) de la [Aemet](https://www.aemet.es) para obtener la predicción del tiempo y envía un mensaje de Telgram
cada vez que la Aemet actualice sus datos.

Necesitas tener un bot de Telegram y conocer tu ID de usuario para que te lleguen los avisos. 
Puedes generar tu bot siguiendo este [tutorial](https://www.toptal.com/python/telegram-bot-tutorial-python).
Para conocer tu ID de usuario puedes usar el bot "@userinfobot"


## Instalación y ejecución
Primero hay que configurar una serie de variables en un fichero ".env" en la raíz del proyecto:
```bash
#Api Aemet
location=28013 #Madrid, por ejemplo
apiKey=???
#Umbral de avisos (%)
avisoTormenta=5
avisoPrecipitacion=5
avisoNieve=5
#Api telegram
token=???
usuarios=???
#Config cron
configCron=*/10 * * * * #Cada 10 minutos
#Node Time Zone
TZ=Europe/Madrid
```
- location: código de la localidad sobre la que quieres recibir los avisos. Puedes encontrarlo [aquí](https://www.ine.es/daco/daco42/codmun/codmunmapa.htm).
- apiKey: necesitas una API key para usar los servicios de Aemet. Puede solicitarla [aquí](https://opendata.aemet.es/centrodedescargas/inicio]).

- avisoTormenta: es el % mínimo de probabilidad con el que quieres recibir los avisos de tormenta. Por ejemplo si estableces el 5, serás notificado si hay un 5% o más de probabilidad de tormenta.
- avisoPrecipitacion: igual que el anterior, pero para la lluvia.
- avisoNieve: igual que el anterior, pero para la nieve.

- token: es el token de Telegram que has generado al crear tu bot.
- usuarios: ID de usuarios de Telegram (separados por ",") a los que quieres enviar notificaciones.

- configCron: frecuencia con la que se consulta el API de Aemet para obtener los datos.
Solo te llegara una notificacion cada vez que Aemet actualiza sus datos, por lo que es probable que el API de Aemet se consulte varias veces pero no te lleguen notificaciones, ya que los datos no han cambiado.

Puede obtener más información sobre cron [aquí](https://www.redeszone.net/tutoriales/servidores/cron-crontab-linux-programar-tareas/).

- TZ: si lo ejecutamos desde Docker, es mejor especificar la zona horaria para que los valores de las fechas sean correctos.

Instalamos las dependencias de Node y ejecutamos:
```bash
npm install 
npm run start
```


## Ejecución con Docker
He construido una imagen para varias arquitecturas para que sea más fácil de ejecutar.
Las arquitecturas disponibles son:
- amd64
- arm/v7
- arm64/v8

Para ejecutarlo con Docker simplemente creamos el archivo '.env' con las variables y ejecutamos:
```bash
 docker run -d --env-file ./.env jaime2196/node-alertalluvia
```