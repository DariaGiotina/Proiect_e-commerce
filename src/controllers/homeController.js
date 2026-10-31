import { listCategories } from '../models/categoryModel.js';
import { listProducts } from '../models/productModel.js';

export function createHomeController(db) {
  return {
    show(req, res) {
      res.render('home', {
        title: 'Home',
        categories: listCategories(db),
        newArrivals: listProducts(db, { sort: 'newest', perPage: 8 }).items,
      });
    },
  };
}
