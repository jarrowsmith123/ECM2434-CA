## Running the App
To start the app you need to be in the root directory and run
make sure to have the docker server running on your machine by
either installing it on the command line and checking it's running
with systemctl or install the Docker Hub app.  Make sure your logged 
into docker on the app.  Also hosted on https://3.237.24.126:8443
```sh
docker-compose up
```


## Alternatively:

## Installation
To run the game, follow these steps:
1. Clone the Repository
```sh
git clone https://github.com/jarrowsmith123/ECM2434-CA
```
2. Navigate to the game directory
```sh
cd ECM2434-CA
```
3. Install dependencies
```sh
npm install
```
4. To start the backend server, navigate to the backend directory and run
```sh
python3 manage.py runserver
```
4. To start the frontend server, navigate to the frontend directory and run
```sh
npm start
```
