var im =require('imagemagick');

im.identify("http://s3.amazonaws.com/thingle/pictures/medium/73250147548.jpg",
  function(err, info) {
    console.log(info);
//    info.on('end', function(i) {
  //    console.log(i)
  //})
})