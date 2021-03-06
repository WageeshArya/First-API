const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null,'./uploads/');
    }
    ,filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') +'-'+ file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
        cb(null, true);
    else
        cb(null,false);
}

const upload = multer({storage: storage, limits: {fileSize: 1024*1024*5}, fileFilter: fileFilter});

const Product = require('../models/product');

mongoose.connect(`mongodb+srv://WageeshArya:${process.env.MONGODB_ATLAS_PASS}@shoe-store-fxrhj.mongodb.net/<dbname>?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


router.get('/', (req, res, next) => { 
    Product.find()
    .select('name price _id productImage')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            products: docs.map(doc => {
                return {
                    name: doc.name,
                    price: doc.price,
                    productImage: req.file.path,
                    request: {
                        type: 'GET',
                        url: `http://localhost:8000/products/${doc._id}`
                    }
                }
            })
        };
        res.status(200).json(response);
    }).catch(err => {
        console.log(err);
        res.status(500).json({errer: err});
    })
});

router.post('/',checkAuth, upload.single('productImage'), (req, res, next) => {
    console.log(req.file);
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });

    product.save().then(result => {
        console.log(result);
        res.status(201).json({
        message: "Handling POST request to products",
        createdProduct: product
    });
    }).catch(err => console.log(err));

    
})

router.get('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.findById(id)
    .select('name price _id productImage')
    .exec()
    .then(doc => {
        console.log(doc);
        res.status(200).json(doc);
    }).catch(err =>{ 
        console.log(err)
        res.status(500).json({error: err});
    });
})

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Product.updateOne({_id: id},{$set: updateOps}).exec().then(result => {
        console.log(result);
        res.status(200).json({
            request: {
                type: 'GET',
                url: `http://localhost:8000/products/${result._id}`
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).json({error: err})
    })
})

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId;
    console.log(id);
    Product.remove({_id: id}).exec().then(result => {
        res.status(200).json(result);
    }).catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
})

module.exports = router;