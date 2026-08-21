const API_BASE = '/api/articulos';

const ESTADO_LABEL = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  agotado: 'Agotado',
  en_transito: 'En tránsito',
};

let articulosCache = [];
let editandoId = null;

/* -------------------- Utilidades -------------------- */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const data = await res.json();
      mensaje = data.errores ? data.errores.join(', ') : (data.error || mensaje);
    } catch (_) { /* respuesta sin cuerpo JSON, por ejemplo 204 */ }
    throw new Error(mensaje);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* -------------------- Render -------------------- */
function articuloCard(a) {
  const thumb = a.imagen_url
    ? `<div class="articulo-thumb">
         <img src="${escapeHtml(a.imagen_url)}" alt="${escapeHtml(a.nombre)}" loading="lazy"
              onerror="this.parentElement.style.display='none'">
       </div>`
    : '';
  return `
    <article class="articulo-card" data-id="${a.id}">
      ${thumb}
      <div class="articulo-top">
        <div>
          <p class="articulo-nombre">${escapeHtml(a.nombre)}</p>
          <p class="articulo-ubicacion"><i class="bi bi-geo-alt"></i> ${escapeHtml(a.ubicacion)}</p>
        </div>
        <span class="estado-badge estado-${a.estado}">${ESTADO_LABEL[a.estado] || a.estado}</span>
      </div>
      ${a.categoria ? `<p class="articulo-tienda"><i class="bi bi-shop"></i> En tienda · ${escapeHtml(a.categoria)}</p>` : ''}
      <p class="articulo-cantidad">${a.cantidad}<small>unidades</small></p>
      <div class="articulo-actions">
        <button class="icon-action edit-btn" data-id="${a.id}"><i class="bi bi-pencil"></i> Editar</button>
        <button class="icon-action danger delete-btn" data-id="${a.id}"><i class="bi bi-trash"></i> Eliminar</button>
      </div>
    </article>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderArticulos(lista) {
  const grid = document.getElementById('articulosGrid');
  const countPill = document.getElementById('countPill');

  countPill.textContent = `${lista.length} artículo${lista.length === 1 ? '' : 's'}`;

  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty-state">No hay artículos que coincidan con la búsqueda.</div>`;
    return;
  }
  grid.innerHTML = lista.map(articuloCard).join('');
}

/* -------------------- Carga inicial -------------------- */
async function cargarArticulos() {
  try {
    articulosCache = await apiFetch(API_BASE);
    renderArticulos(articulosCache);
  } catch (err) {
    showToast(`No se pudo cargar el inventario: ${err.message}`, true);
    document.getElementById('articulosGrid').innerHTML =
      `<div class="empty-state">Error al conectar con la API. Revisá que el servidor esté corriendo.</div>`;
  }
}

/* -------------------- Previsualización del link de imagen -------------------- */
function actualizarPreviewImagen() {
  const url = document.getElementById('imagenUrl').value.trim();
  const preview = document.getElementById('imgPreview');
  const img = document.getElementById('imgPreviewImg');
  const error = document.getElementById('imgPreviewError');

  if (!url) {
    preview.style.display = 'none';
    return;
  }

  preview.style.display = 'flex';
  img.style.display = '';
  error.style.display = 'none';
  img.src = url;
}

/* -------------------- Formulario: registrar / actualizar -------------------- */
function resetFormulario() {
  editandoId = null;
  document.getElementById('articuloForm').reset();
  document.getElementById('articuloId').value = '';
  document.getElementById('formEyebrow').textContent = 'Nuevo registro';
  document.getElementById('formTitle').textContent = 'Registrar artículo';
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Registrar';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('imgPreview').style.display = 'none';
}

function cargarEnFormulario(articulo) {
  editandoId = articulo.id;
  document.getElementById('articuloId').value = articulo.id;
  document.getElementById('nombre').value = articulo.nombre;
  document.getElementById('cantidad').value = articulo.cantidad;
  document.getElementById('ubicacion').value = articulo.ubicacion;
  document.getElementById('estado').value = articulo.estado;
  document.getElementById('imagenUrl').value = articulo.imagen_url || '';
  actualizarPreviewImagen();

  document.getElementById('categoria').value = articulo.categoria || '';
  document.getElementById('precio').value = articulo.precio ?? '';
  document.getElementById('precioAnterior').value = articulo.precio_anterior ?? '';
  document.getElementById('icono').value = articulo.icono || '';
  document.getElementById('especificaciones').value = articulo.especificaciones || '';

  document.getElementById('formEyebrow').textContent = `Editando artículo #${articulo.id}`;
  document.getElementById('formTitle').textContent = `Actualizar "${articulo.nombre}"`;
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check2"></i> Guardar cambios';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';

  document.getElementById('articuloForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function manejarSubmit(e) {
  e.preventDefault();

  const categoriaVal = document.getElementById('categoria').value;
  const enTienda = categoriaVal !== '';
  const precioVal = document.getElementById('precio').value;

  if (enTienda && precioVal === '') {
    showToast('Si el artículo se muestra en la tienda, el precio es obligatorio', true);
    document.getElementById('precio').focus();
    return;
  }

  const payload = {
    nombre: document.getElementById('nombre').value,
    cantidad: parseInt(document.getElementById('cantidad').value, 10),
    ubicacion: document.getElementById('ubicacion').value,
    estado: document.getElementById('estado').value,
    imagen_url: document.getElementById('imagenUrl').value.trim() || null,
    // Campos de catálogo: si el artículo no se muestra en la tienda se
    // envían en null explícitamente, así "desmarcar" también lo saca
    // del catálogo (categoria IS NOT NULL es lo que filtra la tienda).
    categoria: enTienda ? categoriaVal : null,
    precio: enTienda ? Number(precioVal) : null,
    precio_anterior: enTienda && document.getElementById('precioAnterior').value !== ''
      ? Number(document.getElementById('precioAnterior').value) : null,
    icono: enTienda ? (document.getElementById('icono').value.trim() || null) : null,
    especificaciones: enTienda ? (document.getElementById('especificaciones').value.trim() || null) : null,
  };

  try {
    if (editandoId) {
      await apiFetch(`${API_BASE}/${editandoId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Artículo actualizado correctamente');
    } else {
      await apiFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Artículo registrado correctamente');
    }
    resetFormulario();
    await cargarArticulos();
  } catch (err) {
    showToast(`No se pudo guardar: ${err.message}`, true);
  }
}

/* -------------------- Eliminar -------------------- */
async function eliminarArticulo(id) {
  const articulo = articulosCache.find(a => a.id === Number(id));
  const nombre = articulo ? articulo.nombre : `#${id}`;
  if (!confirm(`¿Eliminar "${nombre}" del inventario? Esta acción no se puede deshacer.`)) return;

  try {
    await apiFetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    showToast(`"${nombre}" eliminado`);
    if (editandoId === Number(id)) resetFormulario();
    await cargarArticulos();
  } catch (err) {
    showToast(`No se pudo eliminar: ${err.message}`, true);
  }
}

/* -------------------- Búsqueda (filtra en memoria sobre lo ya cargado) -------------------- */
function filtrar(term) {
  const q = term.trim().toLowerCase();
  if (!q) return renderArticulos(articulosCache);
  const filtrados = articulosCache.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.ubicacion.toLowerCase().includes(q)
  );
  renderArticulos(filtrados);
}

/* -------------------- Inicialización -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  cargarArticulos();

  document.getElementById('articuloForm').addEventListener('submit', manejarSubmit);
  document.getElementById('cancelEditBtn').addEventListener('click', resetFormulario);

  let previewDebounce;
  document.getElementById('imagenUrl').addEventListener('input', () => {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(actualizarPreviewImagen, 300);
  });
  document.getElementById('imgPreviewImg').addEventListener('error', () => {
    document.getElementById('imgPreviewImg').style.display = 'none';
    document.getElementById('imgPreviewError').style.display = 'flex';
  });

  document.getElementById('articulosGrid').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');

    if (editBtn) {
      const articulo = articulosCache.find(a => a.id === Number(editBtn.dataset.id));
      if (articulo) cargarEnFormulario(articulo);
    }
    if (deleteBtn) {
      eliminarArticulo(deleteBtn.dataset.id);
    }
  });

  let debounceTimer;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => filtrar(e.target.value), 180);
  });
});