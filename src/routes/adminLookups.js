import * as categories from '../models/categoryModel.js';
import * as suppliers from '../models/supplierModel.js';
import * as deliveryMethods from '../models/deliveryMethodModel.js';

export const LOOKUP_CONFIGS = [
  {
    basePath: '/admin/categories',
    title: 'Categories',
    singular: 'Category',
    emoji: '🏷️',
    model: {
      list: categories.listCategories,
      getById: categories.getCategoryById,
      create: categories.createCategory,
      update: categories.updateCategory,
      remove: categories.deleteCategory,
    },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'emoji', label: 'Emoji', type: 'emoji', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: false },
    ],
  },
  {
    basePath: '/admin/suppliers',
    title: 'Suppliers',
    singular: 'Supplier',
    emoji: '🚚',
    model: {
      list: suppliers.listSuppliers,
      getById: suppliers.getSupplierById,
      create: suppliers.createSupplier,
      update: suppliers.updateSupplier,
      remove: suppliers.deleteSupplier,
    },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'phone', label: 'Phone', type: 'text', required: false },
    ],
  },
  {
    basePath: '/admin/delivery-methods',
    title: 'Delivery methods',
    singular: 'Delivery method',
    emoji: '📦',
    model: {
      list: deliveryMethods.listDeliveryMethods,
      getById: deliveryMethods.getDeliveryMethodById,
      create: deliveryMethods.createDeliveryMethod,
      update: deliveryMethods.updateDeliveryMethod,
      remove: deliveryMethods.deleteDeliveryMethod,
    },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'priceCents', label: 'Price (RON)', type: 'money', required: true },
      { name: 'eta', label: 'Delivery time', type: 'text', required: true },
    ],
  },
];
