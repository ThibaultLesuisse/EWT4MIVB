# EWT4MIVB
This data collecting tool was created for the purpose of collecting data from the MIVB-STIB in Brussels and can be used by anyone wanting to be able to collect data from the MIVB-STIP. It uses docker and docker compose to manage the appliction runtime and the database used. This tools uses mongdb as its database.

## Installation

To install this tool make sure to:

1. install [Docker](https://docs.docker.com/install/) & [Docker Compose](https://docs.docker.com/compose/install/)  
2. Register on [MIVB/STIB](https://opendata.stib-mivb.be/store/) and be sure to subscribe to the necessary API's
3. Grab the API key and create an .env file from the .env.example file

## Usage

Once everything is installed run `docker-compose up -d` and everything should be running. Note that this tool uses node-cron as cron manager so don't add to the crontab, it should manage fine. In case more monitoring and failureproofing is needed [pm2](http://pm2.keymetrics.io/) could be considered. 

This tool runs every 20 and tries to pull as much stops as possible with every request to minimize the number of requests sent. As an example it is configered to only fetch line 39. 
