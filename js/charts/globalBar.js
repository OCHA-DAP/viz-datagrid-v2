export function renderGlobalBar(container, totals, colors) {
  const values = [
    { val: totals.complete,   color: colors.updated,     name: 'Available & updated' },
    { val: totals.incomplete, color: colors.available,   name: 'Available' },
    { val: totals.noData,     color: colors.unavailable, name: 'Unavailable' }
  ];

  const track = document.createElement('div');
  track.className = 'bar-track bar-track--global';

  const labelsRow = document.createElement('div');
  labelsRow.className = 'bar-labels bar-labels--global';

  values.forEach(d => {
    if (d.val <= 0) return;

    const seg = document.createElement('div');
    seg.className = 'bar-segment';
    seg.style.flex = d.val;
    seg.style.backgroundColor = d.color;
    track.appendChild(seg);

    const lbl = document.createElement('span');
    lbl.style.flex = d.val;
    lbl.textContent = d.val + '%';
    labelsRow.appendChild(lbl);
  });

  container.appendChild(track);
  container.appendChild(labelsRow);
}
