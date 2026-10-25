import { flash } from '../middleware/flash.js';
import { AppError } from '../utils/errors.js';
import { formatPrice, toCents } from '../utils/money.js';

const MAX_LENGTH = { text: 100, email: 254, emoji: 16, textarea: 500 };

export function parseId(value) {
  if (!/^\d{1,9}$/.test(value)) {
    throw new AppError('Oops! Page not found 🎀', 404);
  }
  return Number(value);
}

function toFormValues(fields, row) {
  return Object.fromEntries(
    fields.map((f) => {
      const value = row?.[f.name];
      if (f.type === 'money') {
        return [f.name, value === undefined ? '' : (value / 100).toFixed(2)];
      }
      return [f.name, value ?? ''];
    }),
  );
}

function validate(fields, body) {
  const values = {};
  const data = {};
  const errors = {};

  for (const f of fields) {
    const raw = typeof body[f.name] === 'string' ? body[f.name].trim() : '';
    values[f.name] = raw;

    if (!raw) {
      if (f.required) errors[f.name] = `${f.label} is required.`;
      data[f.name] = '';
      continue;
    }
    if (raw.length > MAX_LENGTH[f.type]) {
      errors[f.name] = `${f.label} can have at most ${MAX_LENGTH[f.type]} characters.`;
      continue;
    }
    if (f.type === 'email' && !raw.includes('@')) {
      errors[f.name] = 'Enter a valid email address.';
      continue;
    }
    if (f.type === 'money') {
      try {
        data[f.name] = toCents(raw);
      } catch (err) {
        errors[f.name] = err.message;
      }
      continue;
    }
    data[f.name] = raw;
  }

  return { values, data, errors };
}

/**
 * One CRUD controller shared by categories, suppliers and delivery methods.
 * config = { basePath, title, singular, emoji, model: { list, getById, create, update, remove }, fields }
 */
export function createLookupController(db, config) {
  const { basePath, title, singular, model, fields } = config;

  function findOr404(id) {
    const row = model.getById(db, parseId(id));
    if (!row) throw new AppError(`This ${singular.toLowerCase()} does not exist.`, 404);
    return row;
  }

  function renderForm(res, status, { id = null, values, errors }) {
    res.status(status).render('admin/lookup-form', {
      title: id ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`,
      config,
      action: id ? `${basePath}/${id}` : basePath,
      values,
      errors,
    });
  }

  function save(req, res, write, id) {
    const { values, data, errors } = validate(fields, req.body);
    if (Object.keys(errors).length > 0) {
      return renderForm(res, 422, { id, values, errors });
    }
    try {
      write(data);
    } catch (err) {
      if (err instanceof AppError && err.status === 409) {
        return renderForm(res, 409, { id, values, errors: { [fields[0].name]: err.message } });
      }
      throw err;
    }
    flash(req, 'success', `${singular} saved ✨`);
    res.redirect(basePath);
  }

  return {
    list(req, res) {
      res.render('admin/lookup-list', {
        title,
        config,
        rows: model.list(db),
        columns: fields.filter((f) => f.type !== 'textarea'),
        formatPrice,
      });
    },

    newForm(req, res) {
      renderForm(res, 200, { values: toFormValues(fields), errors: {} });
    },

    create(req, res) {
      save(req, res, (data) => model.create(db, data));
    },

    editForm(req, res) {
      const row = findOr404(req.params.id);
      renderForm(res, 200, { id: row.id, values: toFormValues(fields, row), errors: {} });
    },

    update(req, res) {
      const row = findOr404(req.params.id);
      save(req, res, (data) => model.update(db, row.id, data), row.id);
    },

    remove(req, res) {
      const row = findOr404(req.params.id);
      model.remove(db, row.id);
      flash(req, 'success', `${singular} deleted.`);
      res.redirect(basePath);
    },
  };
}

export function mountLookupRoutes(router, controller, basePath) {
  const path = basePath.replace(/^\/admin/, '');
  router.get(path, controller.list);
  router.get(`${path}/new`, controller.newForm);
  router.post(path, controller.create);
  router.get(`${path}/:id/edit`, controller.editForm);
  router.post(`${path}/:id`, controller.update);
  router.post(`${path}/:id/delete`, controller.remove);
}
