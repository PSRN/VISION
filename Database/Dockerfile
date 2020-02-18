FROM mongo
RUN apt-get update
VOLUME ["/data/db"]
WORKDIR /data
EXPOSE 27017
CMD ["mongod"]