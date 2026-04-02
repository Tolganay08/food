import { useEffect, useState } from 'react';
import { Plus, Save, Store, Trash2, UtensilsCrossed, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { convertKztToUsd, convertUsdToKzt } from '../../utils/helpers';

const createClientId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createEmptyMenuItem = () => ({
  clientId: createClientId(),
  id: null,
  name: '',
  description: '',
  price: '',
  image: '',
  isAvailable: true,
  isPopular: false,
});

const createEmptyCategory = () => ({
  clientId: createClientId(),
  id: null,
  name: '',
  menuItems: [createEmptyMenuItem()],
});

const mapMenuItemToForm = (item) => ({
  clientId: createClientId(),
  id: item.id || null,
  name: item.name || '',
  description: item.description || '',
  price:
    item.price === undefined || item.price === null
      ? ''
      : convertUsdToKzt(item.price).toFixed(2),
  image: item.image || '',
  isAvailable: item.isAvailable ?? true,
  isPopular: item.isPopular ?? false,
});

const buildFormState = (restaurant) => ({
  id: restaurant?.id || null,
  name: restaurant?.name || '',
  description: restaurant?.description || '',
  address: restaurant?.address || '',
  latitude: restaurant?.latitude ?? 51.515,
  longitude: restaurant?.longitude ?? -0.09,
  image: restaurant?.image || '',
  coverImage: restaurant?.coverImage || '',
  cuisine: restaurant?.cuisine || '',
  deliveryTime: restaurant?.deliveryTime || '25-35 min',
  deliveryFee:
    restaurant?.deliveryFee === undefined || restaurant?.deliveryFee === null
      ? convertUsdToKzt(2.99).toFixed(2)
      : convertUsdToKzt(restaurant.deliveryFee).toFixed(2),
  minOrder:
    restaurant?.minOrder === undefined || restaurant?.minOrder === null
      ? convertUsdToKzt(10).toFixed(2)
      : convertUsdToKzt(restaurant.minOrder).toFixed(2),
  openingTime: restaurant?.openingTime || '09:00',
  closingTime: restaurant?.closingTime || '22:00',
  isActive: restaurant?.isActive ?? true,
  categories:
    restaurant?.categories?.length > 0
      ? restaurant.categories.map((category) => ({
          clientId: createClientId(),
          id: category.id || null,
          name: category.name || '',
          menuItems:
            category.menuItems?.length > 0
              ? category.menuItems.map(mapMenuItemToForm)
              : [createEmptyMenuItem()],
        }))
      : [createEmptyCategory()],
});

const isEmptyNewItem = (item) =>
  !item.id &&
  !item.name.trim() &&
  !item.description.trim() &&
  !item.image.trim() &&
  !item.price;

const isEmptyNewCategory = (category) =>
  !category.id &&
  !category.name.trim() &&
  category.menuItems.every(isEmptyNewItem);

const prepareCategoriesForSubmit = (categories) =>
  categories.flatMap((category, categoryIndex) => {
    if (isEmptyNewCategory(category)) {
      return [];
    }

    const menuItems = category.menuItems.flatMap((item) => {
      if (isEmptyNewItem(item)) {
        return [];
      }
      return [item];
    });

    return [
      {
        ...category,
        sortOrder: categoryIndex + 1,
        menuItems,
      },
    ];
  });

function ItemStarsPreview({ isPopular, t }) {
  if (!isPopular) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-600">
      {t('common.popular')}
    </span>
  );
}

export default function RestaurantEditor({ restaurant, onCancel, onSaved, t }) {
  const [form, setForm] = useState(() => buildFormState(restaurant));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildFormState(restaurant));
  }, [restaurant]);

  const updateCategory = (clientId, updater) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.clientId === clientId ? updater(category) : category
      ),
    }));
  };

  const updateItem = (categoryClientId, itemClientId, updater) => {
    updateCategory(categoryClientId, (category) => ({
      ...category,
      menuItems: category.menuItems.map((item) =>
        item.clientId === itemClientId ? updater(item) : item
      ),
    }));
  };

  const addCategory = () => {
    setForm((current) => ({
      ...current,
      categories: [...current.categories, createEmptyCategory()],
    }));
  };

  const removeCategory = (clientId) => {
    setForm((current) => ({
      ...current,
      categories:
        current.categories.length === 1
          ? [createEmptyCategory()]
          : current.categories.filter((category) => category.clientId !== clientId),
    }));
  };

  const addItem = (categoryClientId) => {
    updateCategory(categoryClientId, (category) => ({
      ...category,
      menuItems: [...category.menuItems, createEmptyMenuItem()],
    }));
  };

  const removeItem = (categoryClientId, itemClientId) => {
    updateCategory(categoryClientId, (category) => ({
      ...category,
      menuItems:
        category.menuItems.length === 1
          ? [createEmptyMenuItem()]
          : category.menuItems.filter((item) => item.clientId !== itemClientId),
    }));
  };

  const validateForm = (preparedCategories) => {
    if (!form.name.trim() || !form.address.trim()) {
      return t('adminPage.restaurantRequiredFields');
    }

    if (!Number.isFinite(Number.parseFloat(form.latitude)) || !Number.isFinite(Number.parseFloat(form.longitude))) {
      return t('adminPage.restaurantLocationInvalid');
    }

    if (!Number.isFinite(Number.parseFloat(form.deliveryFee)) || !Number.isFinite(Number.parseFloat(form.minOrder))) {
      return t('adminPage.restaurantPricingInvalid');
    }

    for (const category of preparedCategories) {
      if (!category.name.trim()) {
        return t('adminPage.categoryNameRequired');
      }

      for (const item of category.menuItems) {
        if (!item.name.trim()) {
          return t('adminPage.menuItemNameRequired');
        }

        const parsedPrice = Number.parseFloat(item.price);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          return t('adminPage.menuItemPriceInvalid');
        }
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const preparedCategories = prepareCategoriesForSubmit(form.categories);
    const validationError = validateForm(preparedCategories);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      address: form.address.trim(),
      latitude: Number.parseFloat(form.latitude),
      longitude: Number.parseFloat(form.longitude),
      image: form.image.trim() || null,
      coverImage: form.coverImage.trim() || null,
      cuisine: form.cuisine.trim() || null,
      deliveryTime: form.deliveryTime.trim() || '25-35 min',
      deliveryFee: Number(convertKztToUsd(form.deliveryFee).toFixed(2)),
      minOrder: Number(convertKztToUsd(form.minOrder).toFixed(2)),
      openingTime: form.openingTime || '09:00',
      closingTime: form.closingTime || '22:00',
      isActive: form.isActive,
      categories: preparedCategories.map((category) => ({
        id: category.id || undefined,
        name: category.name.trim(),
        sortOrder: category.sortOrder,
        menuItems: category.menuItems.map((item) => ({
          id: item.id || undefined,
          name: item.name.trim(),
          description: item.description.trim() || null,
          price: Number(convertKztToUsd(item.price).toFixed(2)),
          image: item.image.trim() || null,
          isAvailable: item.isAvailable,
          isPopular: item.isPopular,
        })),
      })),
    };

    setSaving(true);
    try {
      const response = form.id
        ? await adminAPI.updateRestaurant(form.id, payload)
        : await adminAPI.createRestaurant(payload);

      toast.success(
        form.id ? t('adminPage.restaurantUpdated') : t('adminPage.restaurantCreated')
      );
      onSaved?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || t('adminPage.failedSaveRestaurant'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">
            {form.id ? t('adminPage.editRestaurantWithMenu') : t('adminPage.createRestaurantWithMenu')}
          </h2>
          <p className="mt-1 text-sm text-ink/50">
            {t('adminPage.menuEditorDescription')}
          </p>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            <X size={16} /> {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? t('common.saving') : t('adminPage.saveRestaurantMenu')}
          </button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-primary-500" />
          <h3 className="font-semibold">{t('adminPage.basicInfoTitle')}</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input-field"
            placeholder={t('common.name')}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            className="input-field"
            placeholder={t('common.cuisine')}
            value={form.cuisine}
            onChange={(event) => setForm((current) => ({ ...current, cuisine: event.target.value }))}
          />
        </div>

        <input
          className="input-field"
          placeholder={t('common.address')}
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          required
        />

        <textarea
          className="input-field h-24 resize-none"
          placeholder={t('common.description')}
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="input-field"
            placeholder={t('common.imageUrl')}
            value={form.image}
            onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
          />
          <input
            className="input-field"
            placeholder={t('adminPage.coverImageUrl')}
            value={form.coverImage}
            onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="number"
            step="any"
            className="input-field"
            placeholder={t('common.latitude')}
            value={form.latitude}
            onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))}
          />
          <input
            type="number"
            step="any"
            className="input-field"
            placeholder={t('common.longitude')}
            value={form.longitude}
            onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))}
          />
          <input
            type="number"
            step="0.01"
            className="input-field"
            placeholder={`${t('common.deliveryFee')} (KZT)`}
            value={form.deliveryFee}
            onChange={(event) => setForm((current) => ({ ...current, deliveryFee: event.target.value }))}
          />
          <input
            type="number"
            step="0.01"
            className="input-field"
            placeholder={`${t('common.minOrder')} (KZT)`}
            value={form.minOrder}
            onChange={(event) => setForm((current) => ({ ...current, minOrder: event.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="input-field"
            placeholder={t('adminPage.deliveryTimePlaceholder')}
            value={form.deliveryTime}
            onChange={(event) => setForm((current) => ({ ...current, deliveryTime: event.target.value }))}
          />
          <input
            type="time"
            className="input-field"
            value={form.openingTime}
            onChange={(event) => setForm((current) => ({ ...current, openingTime: event.target.value }))}
          />
          <input
            type="time"
            className="input-field"
            value={form.closingTime}
            onChange={(event) => setForm((current) => ({ ...current, closingTime: event.target.value }))}
          />
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          <span>{t('adminPage.restaurantActiveLabel')}</span>
        </label>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={18} className="text-secondary-500" />
            <div>
              <h3 className="font-semibold">{t('adminPage.menuBuilderTitle')}</h3>
              <p className="text-sm text-ink/50">{t('adminPage.menuBuilderSubtitle')}</p>
            </div>
          </div>

          <button type="button" onClick={addCategory} className="btn-secondary">
            <Plus size={16} /> {t('adminPage.addCategory')}
          </button>
        </div>

        <div className="space-y-4">
          {form.categories.map((category, categoryIndex) => (
            <div key={category.clientId} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-ink/70">
                    {t('adminPage.categoryLabel', { index: categoryIndex + 1 })}
                  </label>
                  <input
                    className="input-field"
                    placeholder={t('adminPage.categoryNamePlaceholder')}
                    value={category.name}
                    onChange={(event) =>
                      updateCategory(category.clientId, (currentCategory) => ({
                        ...currentCategory,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeCategory(category.clientId)}
                  className="inline-flex items-center justify-center rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={16} className="mr-2" />
                  {t('adminPage.removeCategory')}
                </button>
              </div>

              <div className="space-y-3">
                {category.menuItems.map((item, itemIndex) => (
                  <div key={item.clientId} className="rounded-2xl border border-ink/10 bg-surface/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink/60">
                          {t('adminPage.menuItemLabel', { index: itemIndex + 1 })}
                        </span>
                        <ItemStarsPreview isPopular={item.isPopular} t={t} />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(category.clientId, item.clientId)}
                        className="inline-flex items-center rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-2" />
                        {t('adminPage.removeMenuItem')}
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="input-field"
                        placeholder={t('adminPage.menuItemNamePlaceholder')}
                        value={item.name}
                        onChange={(event) =>
                          updateItem(category.clientId, item.clientId, (currentItem) => ({
                            ...currentItem,
                            name: event.target.value,
                          }))
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder={t('adminPage.menuItemPricePlaceholder')}
                        value={item.price}
                        onChange={(event) =>
                          updateItem(category.clientId, item.clientId, (currentItem) => ({
                            ...currentItem,
                            price: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <textarea
                      className="input-field mt-3 h-24 resize-none"
                      placeholder={t('common.description')}
                      value={item.description}
                      onChange={(event) =>
                        updateItem(category.clientId, item.clientId, (currentItem) => ({
                          ...currentItem,
                          description: event.target.value,
                        }))
                      }
                    />

                    <input
                      className="input-field mt-3"
                      placeholder={t('common.imageUrl')}
                      value={item.image}
                      onChange={(event) =>
                        updateItem(category.clientId, item.clientId, (currentItem) => ({
                          ...currentItem,
                          image: event.target.value,
                        }))
                      }
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(event) =>
                            updateItem(category.clientId, item.clientId, (currentItem) => ({
                              ...currentItem,
                              isAvailable: event.target.checked,
                            }))
                          }
                        />
                        <span>{t('common.available')}</span>
                      </label>

                      <label className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isPopular}
                          onChange={(event) =>
                            updateItem(category.clientId, item.clientId, (currentItem) => ({
                              ...currentItem,
                              isPopular: event.target.checked,
                            }))
                          }
                        />
                        <span>{t('common.popular')}</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addItem(category.clientId)}
                className="mt-4 inline-flex items-center rounded-xl border border-primary-100 px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                <Plus size={16} className="mr-2" />
                {t('adminPage.addMenuItem')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
