const amazon = require('aws-sdk');
const fs = require('fs');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

amazon.config.update({
    region: 'us-east-1',
    accessKeyId: 'ASIARYMTMVHDIJASCO2S',
    secretAccessKey: 'eBu+208PQHGlfYYo2ALHcryfWEB0a/HWsZ80+dlb',
    sessionToken: 'FwoGZXIvYXdzEJH//////////wEaDHlCrCeDHexYcL/DqiLAAbODqlwbbORy8Z7jaydZdSexnRFiXyfF+fJIqwpvXWp1ELoVsc7KnKeHtQj7Wx+HUxiLFzmdbrC5qO5Ed8BeaGiG/moQubhA5spRhw1QnPXniVRjkcjv3cQOD3iFl4hLy8CJi8Lb60Ejk7n+QzYD16FdrftVx2zyLxkTG4XLvgMpa7rEhbYNQgSMFzsgqVRrewl1aBKfwPRmzUAjwojt7eqdlOekLuLUnv6A3ZlgSz2EWjsGD+K9fpaih0mZguMETii7rpmkBjItjXs9ipFe8ySpgxdJcJP/laeT8ibQMH6hGNvvdB/q2lPlEfb9iVhZOIcn0Jaf'
  
});


const s3Bucket = new amazon.S3();


const protoFile = grpc.loadPackageDefinition(
  protoLoader.loadSync('computeandstorage.proto', {
    longs: String,
    enums: String,
    keepCase: true,
    defaults: true,
    oneofs: true
  })
);



const StoreData = (call, callback) => {
  const rdata = call.request.data;
  const textfilename = 'abc.txt';

  const parameter = {
    Bucket: 'cloudawsbucketa2',
    ACL:'public-read',
    Key: textfilename,
    Body: rdata
    
  };

  s3Bucket.upload(parameter, (errorCode, data) => {
    if (errorCode) {
      callback(errorCode);
    } else {
      const fileUrl = data.Location;
      callback(null, { s3uri: fileUrl });
    }
  });
};


const AppendData = (call, callback) => {
  const textfilename = 'abc.txt';
  const rdata = call.request.data;
  const parameter = {
    Bucket: 'cloudawsbucketa2',
    Key: textfilename
  };

  s3Bucket.getObject(parameter, (errorCode, result) => {
    if (errorCode) {
      callback(errorCode);
    } else {
      const pdata = result.Body.toString();
      const append = pdata + rdata;
      parameter.Body = append;

      s3Bucket.upload(parameter, (errorCode, data) => {
        if (errorCode) {
          callback(errorCode);
        } else {
          const fileUrl = data.Location;
          callback(null, { s3uri: fileUrl });
        }
      });
    }
  });
};

const DeleteFile = (call, callback) => {
  const fileUrl = call.request.s3uri;

  const parameter = {
    Bucket: 'cloudawsbucketa2',
    Key: extractKeyFromUrl(fileUrl)
  };

  s3Bucket.headObject(parameter, (errorCode, metadata) => {
    if (errorCode && errorCode.code === 'NotFound') {
      const fnf = new Error('File not found');
      fnf.code = 404;
      callback(fnf);
    } else if (errorCode) {
      callback(errorCode);
    } else {
      s3Bucket.deleteObject(parameter, (errorCode, data) => {
        if (errorCode) {
          callback(errorCode);
        } else {
          callback(null, {});
        }
      });
    }
  });
};

function extractKeyFromUrl(url) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
}

// const s = new grpc.Server();

// s.addService(protoFile.computeandstorage.EC2Operations.service, { StoreData, AppendData, DeleteFile });


// s.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
//   s.start();
// });

function getServer() {
  var server = new grpc.Server();
  server.addService(protoFile.computeandstorage.EC2Operations.service, {
    StoreData, AppendData, DeleteFile
  });
  return server;
}
var routeServer = getServer();
routeServer.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  routeServer.start();
});
