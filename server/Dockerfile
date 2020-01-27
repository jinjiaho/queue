FROM golang:1.11.1-alpine3.8
RUN mkdir /server
ADD . /server/
WORKDIR /server
RUN go mod download
RUN go build -o main ./...
CMD ["/server/main"]