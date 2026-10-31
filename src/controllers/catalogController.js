import { getCategoryBySlug, listCategories } from '../models/categoryModel.js';
import { getProductBySlug, listProducts, SORT_OPTIONS } from '../models/productModel.js';
import { AppError } from '../utils/errors.js';

const SORT_LABELS = {
  newest: 'Newest',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  name: 'Name: A to Z',
};

function queryString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createCatalogController(db) {
  return {
    list(req, res) {
      const categorySlug = queryString(req.query.category);
      const q = queryString(req.query.q).slice(0, 100);
      const sort = SORT_OPTIONS.includes(req.query.sort) ? req.query.sort : 'newest';
      const page = Number.parseInt(req.query.page, 10) || 1;

      const category = categorySlug ? getCategoryBySlug(db, categorySlug) : null;
      if (categorySlug && !category) {
        throw new AppError('This category does not exist 🎀', 404);
      }

      const result = listProducts(db, { categorySlug, q, sort, page });
      const pageUrl = (n) => {
        const params = new URLSearchParams();
        if (categorySlug) params.set('category', categorySlug);
        if (q) params.set('q', q);
        if (sort !== 'newest') params.set('sort', sort);
        if (n > 1) params.set('page', String(n));
        const text = params.toString();
        return text ? `/products?${text}` : '/products';
      };

      res.render('catalog/list', {
        title: category ? category.name : q ? `Search: ${q}` : 'Shop',
        categories: listCategories(db),
        category,
        q,
        sort,
        sortLabels: SORT_LABELS,
        result,
        pageUrl,
      });
    },

    show(req, res) {
      const product = getProductBySlug(db, req.params.slug);
      if (!product) {
        throw new AppError('This product does not exist 🎀', 404);
      }
      res.render('catalog/product', { title: product.name, product });
    },
  };
}
