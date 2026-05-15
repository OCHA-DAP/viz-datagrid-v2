export function renderCountryBar(container, data, colors) {
  const tooltip = document.querySelector('.tooltip-custom');
  const values = [
    { val: data.complete,   color: colors.updated,     name: 'Available and up-to-date' },
    { val: data.incomplete, color: colors.available,   name: 'Available and not up-to-date' },
    { val: data.noData,     color: colors.unavailable, name: 'Unavailable' }
  ];

  const visible = values.filter(d => d.val > 0);

  const chart = document.createElement('div');
  chart.className = 'card-bar-chart';

  visible.forEach((d, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-bar-segment';
    wrapper.style.flex = d.val;

    const bar = document.createElement('div');
    bar.className = 'card-bar-fill';
    bar.style.backgroundColor = d.color;

    const isFirst = i === 0;
    const isLast  = i === visible.length - 1;
    if (isFirst && isLast) bar.style.borderRadius = '2px';
    else if (isFirst)      bar.style.borderRadius = '2px 0 0 2px';
    else if (isLast)       bar.style.borderRadius = '0 2px 2px 0';

    bar.addEventListener('mouseover', () => {
      tooltip.textContent = d.val + '% ' + d.name.toLowerCase();
      tooltip.style.display = 'block';
    });
    bar.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
    });

    const label = document.createElement('span');
    label.className = 'card-bar-label';
    label.textContent = d.val + '%';

    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    chart.appendChild(wrapper);
  });

  container.appendChild(chart);
}
