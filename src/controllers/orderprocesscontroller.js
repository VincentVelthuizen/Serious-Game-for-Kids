import Controller from './core/controller';
import Product from '../models/classes/product';

export default class OrderProcessController extends Controller
{
    constructor(order)
    {
        super();

        this.order = order;
    }

    /**
     * TODO
     */
    processOrder()
    {
        this.order.products.forEach(product => {
            while (product.values.quantity)
            {
                if (product.values.isPerishable && this.order.constructor.name == "CustomerOrder") {
                    this._perishableOrder(product);
                } else {
                    this._nonPerishableOrder(product);
                }
            }
        });

        if (this.order.products.every(product => product.values.quantity === 0)) {
            return true;
        }
    }

    /**
     * @private
     */
    _perishableOrder(product)
    {
        const minIndex = this._checkMostPerishedContainer(product);

        let mostPerishedContainer = GAME.model.warehouse.items[minIndex];

        let perishedQuantity = this._checkPerishedQuantity(product, mostPerishedContainer);

        let perishedProduct = new Product(product.name, {quantity: perishedQuantity});

        product.values.quantity = mostPerishedContainer.removeItem(product, perishedProduct);

        return product.values.quantity;
    }

    /**
     * @private
     */
    _nonPerishableOrder(product)
    {
        // see http://stackoverflow.com/a/2641374/4316405
        GAME.model.warehouse.items.every(container => {
            const cases = {
                "FactoryOrder": container.addItem.bind(container),
                "CustomerOrder": container.removeItem.bind(container)
            };

            product.values.quantity = cases[this.order.constructor.name](product);
            return product.values.quantity;
        });
    }

    /**
     * @private
     */
    _checkMostPerishedContainer(product)
    {
        // Code underneath creates an array (perishableArray) which contains the lowest perished value
        // (so, most perished product) of the order product, of all containers.
        //
        let perishableArray = [];
        GAME.model.warehouse.items.forEach(function(container) {
            let perishables = container.items
                .filter(item => item.name == product.name)
                .map(item => item.values.perishable);
            perishableArray.push(Math.min(...perishables));
        });

        let minIndex = 0;

        // Here, the index of the minimum of the array is found, which corresponds with the index of the
        // most perished container.

        let min = perishableArray[0];

        for (let i = 1; i < perishableArray.length; i++) {
            if (perishableArray[i] < min && perishableArray[i] != 0) {
                minIndex = i;
                min = perishableArray[i];
            }
        }

        return minIndex;
    }

    /**
     * @private
     */
    _checkPerishedQuantity(product, mostPerishedContainer)
    {
        // This function checks how many of the most perished product there are left

        let perishedQuantityArray = mostPerishedContainer.items
            .filter(item => item.name == product.name)
            .map(item => item.values.quantity);

        let perishedQuantity = Math.min(perishedQuantityArray[0], product.values.quantity);

        return perishedQuantity;
    }
}