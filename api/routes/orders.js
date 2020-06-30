const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/order');

router.get('/', (req, res, next) => {
    Order.find()
    .select('product quantity _id')
    .populate('product')
    .exec()
    .then(docs => {
        res.status(200).json({
            count: docs.length,
            orders: docs.map(doc => {
               return {
                    _id: doc._id,
                    product: doc.product,
                    quantity: doc.quantity,
                    request: {
                        type: 'GET',
                        url: `http://localhost:8000/orders/${doc._id}`
                    }
               }
            })
        });
    })
    .catch(err => {
        res.status(500).json({
            err: error
        })
    });
});

router.post('/',(req, res, next) => {
    const order = new Order({
        _id: mongoose.Types.ObjectId(),
        quantity: req.body.quantity,
        product: req.body.productId
    });
    order.save()
    .then(result => {
            console.log(result);
            res.status(200).json({
                message: "Order stored",
                createdOrder: {
                    id: result._id,
                    product: result.product,
                    quantity: result.quantity
                },
                request: {
                    type: "POST",
                    url: `http://localhost:8000/${result._id}`
                }
            });
    })
    .catch(err => res.status(500).json({   error: err  }));
});

router.get('/:orderId', (req, res, next) => {
    const id = req.params.orderId;
    Order.findById(req.params.orderId)
    .exec()
    .then(order => {
        if(!order) {
            return res.status(404).json({
                error: "No such orders"
            });
        }
        res.status(200).json({
            order: order,
            request: {
                type: 'GET',
                url: `http://localhost:8000/orders/${req.params.orderId}`
            }
        })
    })
    .catch(err => {
        res.status(500).json({
            error: err
        })
    });
});

router.delete('/:orderId', (req, res, next) => {
    const id = req.params.orderId;
    Order.remove({_id: id})
    .exec()
    .then(result => {
        res.status(200).json({
            message: 'Order deleted',
            request: {
                type: 'POST',
                url: 'http://localhost:8000/orders',
                body: {
                    productId: 'ID',
                    quantity: 'Number'
                }
            }
        })
    })
    .catch()
});

module.exports = router;