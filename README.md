# :tram: EWT4MIVB :bus:
This data collecting tool was created for the purpose of collecting data from the MIVB-STIB in Brussels and can be used by anyone wanting to be able to collect data from the MIVB-STIP. It uses docker and docker compose to manage the appliction runtime and the database used. This tools uses mongdb as its database.

## Installation

To install this tool make sure to:

1. Install [Docker](https://docs.docker.com/install/) & [Docker Compose](https://docs.docker.com/compose/install/)
2. Create a docker volume named `mongo_db` to make sure the database doesn't get lost when restarting docker 
3. Register on [MIVB/STIB](https://opendata.stib-mivb.be/store/) and be sure to subscribe to the necessary API's
4. Grab the API key and create an .env file from the .env.example file

## Overview

This project consists of 4 parts:
1. Scraper that will query the MIVB-STIB every 20 seconds.
2. GTFS parser. 
3. Delay calculator, together with an EWT calculator.
4. React webapp that will display the results.

### Scraper

Once everything is installed run `docker-compose up -d` (if you want to attach the stdout and stderr to the terminal remove the -d, -d stands for detach) and everything should be running. Note that this tool uses node-cron as cron manager so don't add to the crontab, it should manage fine. In case more monitoring and failureproofing is needed [pm2](http://pm2.keymetrics.io/) could be considered. Docker will run the scraper file and save the output to a mongodb database. For security reasons you will need to add the node user manually. More information about adding user and their passwords can be found on the [mongo-website]. If I can find the time i will automate it. Also important for performance is to create indexes on the time fields in the database. This will speed up querying by a lot!

### GTFS Parser

GTFS contains a few quirks (for example if a certain line runs until after midnight it will count up the hours, finding 27:00 is thus not uncommon). To extract the relevant data for I created a GTFS-parser. It can be found in the gtfs_parser.js file. It uses regular expressions to extract the necessary data. 


### Delay calculator

Once the GTFS parser is done and has written the needed files we can start measuring the delay. This will be done by querying the database and comparing it with the GTFS-files. Basically it will look up a certain arrival time (for those wondering arrival and departure time are the same!!) in the database. For example if the GTFS files say a tram/bus/metro should arrive at 10:00 we will look at 9:59 if there is one coming in 1 minute. If not the tram/bus/metro is delayed. There is one big but though. The data from the MIVB-STIB does not contain a trip_id! This makes very difficult, actually impossible, to know for sure if the tram we are looking in the GTFS files is the right one. Second big issue is that if two trams/buses/metros are close together they show up in the data as one. Therefor the calculations should be take for granted! No accurate conclusion is therefor possible from this data. !!

### Front-end

To display the data in a orderly fashion.
//TODO

