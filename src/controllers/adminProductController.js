import { flash } from '../middleware/flash.js';
import { removeUploadedImage } from '../middleware/upload.js';
import { listCategories } from '../models/categoryModel.js';
import { listDeliveryMethods } from '../models/deliveryMethodModel.js';
import { listSuppliers } from '../models/supplierModel.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProductsForAdmin,
  updateProduct,
} from '../models/productModel.js';
import { AppError } from '../utils/errors.js';
import { formatSpecs } from '../utils/specs.js';
import { validateProduct } from '../utils/validation.js';
import { parseId } from './adminLookupController.js';

const LOW_STOCK = 5;

function formValuesFromProduct(product) {
  return {
    name: product.name,
    description: product.description,
    specs: formatSpecs(product.specs),
    price: (product.priceCents / 100).toFixed(2),
    stock: String(product.stock),
    categoryId: product.category.id,
    supplierId: product.supplier.id,
    deliveryMethodIds: product.deliveryMethods.map((d) => d.id),
  };
}

function formValuesFromBody(body) {
  const field = (name) => (typeof body[name] === 'string' ? body[name] : '');
  return {
    name: field('name'),
    description: field('description'),
    specs: field('specs'),
    price: field('price'),
    stock: field('stock'),
    categoryId: Number(field('categoryId')) || null,
    supplierId: Number(field('supplierId')) || null,
    deliveryMethodIds: [].concat(body.deliveryMethodIds ?? []).map(Number),
  };
}

export function createAdminProductController(db, uploadsDir) {
  function lookups() {
    return {
      categories: listCategories(db),
      suppliers: listSuppliers(db),
      deliveryMethods: listDeliveryMethods(db),
    };
  }

  function findOr404(id) {
    const product = getProductById(db, parseId(id));
    if (!product) throw new AppError('This product does not exist.', 404);
    return product;
  }

  function renderForm(res, status, { product = null, values, errors }) {
    res.status(status).render('admin/product-form', {
      title: product ? `Edit ${product.name}` : 'New product',
      action: product ? `/admin/products/${product.id}` : '/admin/products',
      product,
      values,
      errors,
      ...lookups(),
    });
  }

  // Validates the posted form; on failure re-renders it and deletes any just-uploaded file.
  function readForm(req, res, product) {
    const { categories, suppliers, deliveryMethods } = lookups();
    const { data, errors } = validateProduct(req.body, {
      categoryIds: categories.map((c) => c.id),
      supplierIds: suppliers.map((s) => s.id),
      deliveryMethodIds: deliveryMethods.map((d) => d.id),
    });
    if (req.imageError) errors.image = req.imageError;

    if (Object.keys(errors).length > 0) {
      if (req.file) removeUploadedImage(uploadsDir, `/uploads/${req.file.filename}`);
      renderForm(res, 422, { product, values: formValuesFromBody(req.body), errors });
      return null;
    }
    return { ...data, imagePath: req.file ? `/uploads/${req.file.filename}` : undefined };
  }

  return {
    list(req, res) {
      res.render('admin/products', {
        title: 'Products',
        products: listProductsForAdmin(db),
        lowStock: LOW_STOCK,
      });
    },

    newForm(req, res) {
      renderForm(res, 200, {
        values: { name: '', description: '', specs: '', price: '', stock: '', deliveryMethodIds: [] },
        errors: {},
      });
    },

    create(req, res) {
      const input = readForm(req, res, null);
      if (!input) return;
      createProduct(db, input);
      flash(req, 'success', `“${input.name}” saved ✨`);
      res.redirect('/admin/products');
    },

    editForm(req, res) {
      const product = findOr404(req.params.id);
      renderForm(res, 200, { product, values: formValuesFromProduct(product), errors: {} });
    },

    update(req, res) {
      const product = findOr404(req.params.id);
      const input = readForm(req, res, product);
      if (!input) return;
      updateProduct(db, product.id, input);
      if (input.imagePath) removeUploadedImage(uploadsDir, product.imagePath);
      flash(req, 'success', `“${input.name}” saved ✨`);
      res.redirect('/admin/products');
    },

    remove(req, res) {
      const product = findOr404(req.params.id);
      deleteProduct(db, product.id);
      removeUploadedImage(uploadsDir, product.imagePath);
      flash(req, 'success', `“${product.name}” deleted.`);
      res.redirect('/admin/products');
    },
  };
}
