// Pastille « Ouvert maintenant / Fermé » sur l'heure réelle de Paris.
import { getOpenStatus, onCleanup } from './utils.js';

export function initInfos() {
  const status = document.getElementById('status');
  const label = document.getElementById('statusLabel');
  const next = document.getElementById('statusNext');
  const days = [...document.querySelectorAll('#hours > div')];

  const update = () => {
    const s = getOpenStatus();
    status.dataset.state = s.open ? 'open' : 'closed';
    label.textContent = s.label;
    next.textContent = s.next;
    days.forEach((d) => d.classList.toggle('is-today', d.dataset.days.split(',').includes(String(s.day))));
  };
  update();
  const id = setInterval(update, 30000);
  onCleanup(() => clearInterval(id));
}
