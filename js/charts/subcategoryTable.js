const DATA_COMPLETE          = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=1171577919&single=true&output=csv';
const PCT_COMPLETE_SUBCATEGORY = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=1944345237&single=true&output=csv';
const PCT_COMPLETE_COUNTRY     = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=579688831&single=true&output=csv';

const pctFormat = d3.format('.0%');
const isMetaCol = col => col === 'subcategory' || col === 'percentComplete';

const statusLabel = {
  'Complete':   'Available & up-to-date',
  'Incomplete': 'Available, not up-to-date',
  'Empty':      'Unavailable',
  'NA':         'Not applicable'
};

const ICON_MAP = {
  'Affected People':                    'affected',
  'Affected Population':                'affected',
  'Climate':                            'climate',
  'Drought':                            'climate',
  'Coordination & Context':             'coordination',
  'Coordination':                       'coordination',
  'Food Security & Nutrition':          'food',
  'Food Security':                      'food',
  'Geography & Infrastructure':         'location',
  'Locations & Infrastructure':         'location',
  'Health & Education':                 'health',
  'Health':                             'health'
};

export function init(sectionEl) {
  let columns, items = [], originalItems = [];
  let sortOrder = 'category';
  let headerCells = [];

  const tableEl  = sectionEl.querySelector('.sc-table-container');
  const sortBtn  = sectionEl.querySelector('.sc-sort-btn');
  const dropdown = sectionEl.querySelector('.sc-order-dropdown');
  const toggleText = sectionEl.querySelector('.sc-dropdown-toggle-text');

  const tooltip = d3.select('body').append('div')
    .attr('class', 'sc-tooltip')
    .style('opacity', 0);

  sortBtn.addEventListener('click', () => {
    dropdown.classList.add('open');
  });

  document.addEventListener('mouseup', (e) => {
    if (e.target !== sortBtn && !sortBtn.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  sectionEl.querySelectorAll('.sc-dropdown-menu a').forEach((link) => {
    link.addEventListener('click', function() {
      toggleText.innerHTML = this.innerHTML;
      const val = this.getAttribute('val');
      if (val !== sortOrder) {
        sortOrder = val;
        sortTable();
      }
    });
  });

  function getData() {
    Promise.all([
      d3.csv(DATA_COMPLETE),
      d3.csv(PCT_COMPLETE_SUBCATEGORY),
      d3.csv(PCT_COMPLETE_COUNTRY)
    ]).then(function([data, pctSubcategoryData, pctCountryData]) {
      columns = Array.from(new Set(data.map(d => d['Location']))).sort();
      columns.unshift('subcategory');
      columns.push('percentComplete');

      const categories = d3.group(data, d => d['Category']);
      const subcategoryOrder = [];
      categories.forEach(function(cat) {
        const subcats = Array.from(new Set(cat.map(d => d['Subcategory'])));
        subcats.forEach(sc => subcategoryOrder.push({ category: cat[0]['Category'], subcategory: sc }));
      });

      const subcategories    = d3.group(data, d => d['Subcategory'], d => d['Location']);
      const pctComplete      = d3.group(pctSubcategoryData, d => d['Subcategory']);
      const pctCountryComplete = d3.group(pctCountryData, d => d['Location']);

      const pctCountryValues = { subcategory: 'countryPctComplete', percentComplete: null };
      columns.forEach(col => {
        const pctCountry = pctCountryComplete.get(col);
        if (pctCountry !== undefined) pctCountryValues[col] = pctCountry[0]['Percentage Data Complete'];
      });

      subcategoryOrder.forEach(function(sc) {
        const subcategory = subcategories.get(sc.subcategory);
        const pct = pctComplete.get(sc.subcategory);
        if (pct === undefined) return;
        const item = { subcategory: sc.subcategory, percentComplete: pct[0]['Percentage Data Complete'], category: sc.category };
        let isNA = true;
        columns.forEach(col => {
          const arr = subcategory.get(col);
          if (arr !== undefined) {
            item[col] = arr[0]['Status'];
            if (arr[0]['Status'] !== 'Not applicable') isNA = false;
          }
        });
        if (!isNA) items.push(item);
      });

      items.push(pctCountryValues);
      originalItems = [...items];

      createTable();
    });
  }

  function sortTable() {
    if (sortOrder === 'category') {
      items = [...originalItems];
    } else {
      const pctRow = items.pop();
      items.sort((a, b) =>
        sortOrder === 'dsc'
          ? d3.descending(a.percentComplete, b.percentComplete)
          : d3.ascending(a.percentComplete, b.percentComplete)
      );
      items.push(pctRow);
    }

    const rebuild = () => {
      d3.select(tableEl).select('tbody').selectAll('*').remove();
      buildRows();
    };
    d3.select(tableEl).select('tbody').selectAll('tr')
      .transition().duration(80).style('opacity', 0)
      .end().then(rebuild).catch(rebuild);
  }

  function createTable() {
    const table = d3.select(tableEl).append('table');
    table.append('thead').append('tr')
      .selectAll('th')
      .data(columns).enter()
      .append('th')
      .classed('rotate', d => !isMetaCol(d))
      .html(d => {
        if (isMetaCol(d)) return '';
        const label = d.length > 20 ? d.slice(0, 20) + '…' : d;
        return `<div title="${d}">${label}</div>`;
      });

    headerCells = Array.from(tableEl.querySelectorAll('thead th'));
    table.append('tbody');
    buildRows();
  }

  function buildRows() {
    const tbody = d3.select(tableEl).select('tbody');
    const rows = tbody.selectAll('tr')
      .data(items).enter()
      .append('tr')
      .attr('class', d => d.subcategory);

    rows
      .style('opacity', 0)
      .transition().duration(120)
      .delay((d, i) => {
        if (i === items.length - 1) return (items.length - 1) * 7;
        return sortOrder === 'asc' ? (items.length - 2 - i) * 7 : i * 7;
      })
      .style('opacity', 1);

    rows.selectAll('td')
      .data(d => columns.map(col => {
        const raw = d[col] === undefined ? 'Empty' : d[col];
        const val = raw === 'Not applicable' ? 'NA' : raw;
        const obj = { name: col, value: val, category: d.category === undefined ? d.subcategory : d.category };
        if (d.subcategory !== 'countryPctComplete') obj.subcategory = d.subcategory;
        return obj;
      })).enter()
      .append('td')
      .attr('class', d => {
        const val = d.category === 'countryPctComplete' ? d.value : 'completeness ' + d.value;
        return isMetaCol(d.name) ? d.name : val;
      })
      .html(d => {
        if (d.name === 'subcategory') {
          const icon = ICON_MAP[d.category];
          const img = icon ? `<img src="assets/icons/${icon}.svg" alt="" aria-hidden="true" width="20" height="20">` : '';
          return `${d.value}<div class="icon-container">${img}</div>`;
        }
        if (d.name === 'percentComplete' || d.category === 'countryPctComplete') {
          return pctFormat(d.value);
        }
        return '';
      })
      .on('mouseover', function(event, d) {
        const row = event.target.parentElement;
        if (!row.classList.contains('countryPctComplete')) row.classList.add('active');

        const colIndex = event.target.cellIndex;
        headerCells[colIndex]?.classList.add('active');

        let content = '';
        if (d.name === 'subcategory') {
          content = d.category;
        } else if (d.name === 'percentComplete') {
          content = `Available % of ${d.subcategory}: <strong>${pctFormat(d.value)}</strong>`;
        } else if (d.category === 'countryPctComplete') {
          content = `Available % of ${d.name}: <strong>${pctFormat(d.value)}</strong>`;
        } else {
          content = `${d.subcategory} - ${d.name}: ${statusLabel[d.value] || d.value}`;
        }

        tooltip.html(content);
        tooltip.transition().duration(200).style('opacity', .9);

        const posEl = d.name === 'subcategory'
          ? (event.target.querySelector('.icon-container') || event.target)
          : event.target;
        const targetRect  = posEl.getBoundingClientRect();
        const targetTop   = targetRect.top;
        const targetLeft  = targetRect.left;
        const targetWidth = posEl.offsetWidth;
        const tooltipNode = tooltip.node();
        const tooltipHeight = tooltipNode.offsetHeight;
        const tooltipWidth  = tooltipNode.offsetWidth;
        const isPercentComplete = d.name === 'percentComplete';
        const rawLeft = isPercentComplete
          ? targetLeft + targetWidth - tooltipWidth
          : targetLeft + targetWidth / 2 - tooltipWidth / 2;
        const clampedLeft = Math.max(8, Math.min(rawLeft, window.innerWidth - tooltipWidth - 8));

        tooltip
          .style('top', (targetTop - tooltipHeight) + 'px')
          .style('left', clampedLeft + 'px')
          .classed('right', isPercentComplete);
      })
      .on('mouseout', function(event) {
        event.target.parentElement.classList.remove('active');
        headerCells.forEach(th => th.classList.remove('active'));
        tooltip.transition().duration(500).style('opacity', 0);
      });
  }

  getData();
}
