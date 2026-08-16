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
  return `
    <article class="articulo-card" data-id="${a.id}">
      <div class="articulo-top">
        <div>
          <p class="articulo-nombre">${escapeHtml(a.nombre)}</p>
          <p class="articulo-ubicacion"><i class="bi bi-geo-alt"></i> ${escapeHtml(a.ubicacion)}</p>
        </div>
        <span class="estado-badge estado-${a.estado}">${ESTADO_LABEL[a.estado] || a.estado}</span>
      </div>
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

/* -------------------- Formulario: registrar / actualizar -------------------- */
function resetFormulario() {
  editandoId = null;
  document.getElementById('articuloForm').reset();
  document.getElementById('articuloId').value = '';
  document.getElementById('formEyebrow').textContent = 'Nuevo registro';
  document.getElementById('formTitle').textContent = 'Registrar artículo';
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-plus-circle"></i> Registrar';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

function cargarEnFormulario(articulo) {
  editandoId = articulo.id;
  document.getElementById('articuloId').value = articulo.id;
  document.getElementById('nombre').value = articulo.nombre;
  document.getElementById('cantidad').value = articulo.cantidad;
  document.getElementById('ubicacion').value = articulo.ubicacion;
  document.getElementById('estado').value = articulo.estado;

  document.getElementById('formEyebrow').textContent = `Editando artículo #${articulo.id}`;
  document.getElementById('formTitle').textContent = `Actualizar "${articulo.nombre}"`;
  document.getElementById('submitBtn').innerHTML = '<i class="bi bi-check2"></i> Guardar cambios';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';

  document.getElementById('articuloForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function manejarSubmit(e) {
  e.preventDefault();

  const payload = {
    nombre: document.getElementById('nombre').value,
    cantidad: parseInt(document.getElementById('cantidad').value, 10),
    ubicacion: document.getElementById('ubicacion').value,
    estado: document.getElementById('estado').value,
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