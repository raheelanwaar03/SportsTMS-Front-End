# Sports TMS Frontend

 Sports Tournament Management System using  microservices.

## Run With Docker

Start your API containers with their ports exposed on localhost, then build and run the frontend container:

```bash
docker build -t sport-tms-frontend .
docker run --rm -p 8080:80 sport-tms-frontend
```