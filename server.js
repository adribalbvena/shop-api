//Requires the Express module just as you require other modules and and puts it in a variable.
var express = require('express');
//Calls the express function "express()" and puts new Express application inside the app variable (to start a new Express application). It's something like you are creating an object of a class. Where "express()" is just like class and app is it's newly created object.
var app = express();
//To handle HTTP POST requests in Express.js version 4 and above, you need to install the middleware module called body-parser
//body-parser extracts the entire body portion of an incoming request stream and exposes it on req.body.
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var db = mongoose.connect("mongodb://localhost:27017/swag-shop", {
   useNewUrlParser: true,
   useUnifiedTopology: true
 });

 var Product = require('./model/product');
 var WishList = require('./model/wishlist');

app.all('/*', function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  response.header("Access-Control-Allow-Methos", "POST, GET");
  next();
});

//Returns middleware that only parses json and only looks at requests where the Content-Type header matches the type option
app.use(bodyParser.json());
//The extended option allows to choose between parsing the URL-encoded data with the querystring library (when false) or the qs library (when true). The “extended” syntax allows for rich objects and arrays to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded
app.use(bodyParser.urlencoded({extended: false}));

app.post('/product', function(request, response) {
  var product = new Product();
  product.title = request.body.title;
  product.price = request.body.price;
  product.save(function(err, savedProduct) {
    if (err) {
      response.status(500).send({error: "Could not save product."})
    } else {
      response.status(200).send(savedProduct);
    }
  });
});

app.get('/product', function(request, response){
  //Esta parte es asincronica, por lo que abre un nuevo hilo de procesamiento, entonces todo el proceso tiene que estar dentro de esto
  Product.find({}, function(err, products) {
    if (err) {
      response.status(500).send({error: "Could not fetch products."});
    } else {
      response.send(products);
    }
  });
});

app.get('/wishlist', function(request, response){
  //Aca con populate le estamos diciendo a la db que nos de por cada wishlist toda la data de los productos
  WishList.find({}).populate({path: 'products', model: 'Product'}).exec(function(err, wishLists) {
    if (err) {
      response.status(500).send({error: "Could not fetch wishlist"});
    } else {
      response.status(200).send(wishLists);
    }
  });
});

app.post('/wishlist', function(request, response){
  var wishList = new WishList();
  wishList.title = request.body.title;

  wishList.save(function(err, newWishList) {
    if (err) {
      response.status(500).send({error: "Could not create wishlist."});
    } else {
      response.send(newWishList);
    }
  });
});

app.put('/wishlist/product/add', function(request, response){
  Product.findOne({_id: request.body.productId}, function(err, product){
    if (err) {
      response.status(500).send({error: "Could not add item to wishlist."});
    } else {
      WishList.updateOne({_id: request.body.wishListId}, {$addToSet:{products: product._id}}, function(err, wishList){
        if (err) {
          response.status(500).send({error: "Could not add item to wishlist."});
        } else {
          response.send("Successfully added to wishlist");
        }
      });
    }
  });
});

app.listen(3004, function() {
  console.log("Swag Shop API running on port 3004...")
});
