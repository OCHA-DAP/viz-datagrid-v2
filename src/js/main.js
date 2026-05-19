import { renderGlobalBar } from './charts/globalBar.js';
import { renderCountryBar } from './charts/countryBar.js';
import { init as initSubcategoryTable } from './charts/subcategoryTable.js';

const DATA_PATH = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?single=true&output=csv&gid=';
const DATA_ID          = 1103779481;
const DATASET_COUNTS_ID = 733089483;
const GLOBAL_COUNTS_ID  = 2045883069;

const COLORS = {
  updated:     '#0e3b82',
  available:   '#4681e0',
  unavailable: '#c4d0d1'
};

const CATEGORY_ICONS = {
  'Affected People':                        'affected',
  'Affected Population':                    'affected',
  'Population & Socio-economic Indicators': 'affected',
  'Coordination':                           'coordination',
  'Coordination & Context':                 'coordination',
  'Food Security':                          'food',
  'Food Security, Nutrition & Poverty':     'food',
  'Geography & Infrastructure':             'location',
  'Locations & Infrastructure':             'location',
  'Health':                                 'health',
  'Health & Education':                     'health',
  'Drought':                                'climate',
  'Climate':                                'climate'
};

const chevronDown = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 6L8 10L4 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const chevronUp   = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let globalCounts;
let allCountries = [];
let sortMode = 'az';

document.addEventListener('DOMContentLoaded', () => {
  setupTooltip();
  setupSortControls();
  setupLegendDrawer();
  getData();
});

function getData() {
  Promise.all([
    d3.csv(DATA_PATH + DATA_ID),
    d3.csv(DATA_PATH + DATASET_COUNTS_ID),
    d3.csv(DATA_PATH + GLOBAL_COUNTS_ID)
  ]).then(([mainData, datasetCounts, globalCountsData]) => {
    globalCounts = globalCountsData[0];
    allCountries = datasetCounts;

    const categories = d3.groups(mainData, d => d['Category']).map(([key]) => key);
    const date = formatDate(mainData[0]['Date']);

    renderIntro(categories, date);
    renderOverview();
    renderCountryGrid(allCountries);
    initSubcategoryTable(document.getElementById('subcategory'));

    document.querySelector('.loader').style.display = 'none';
    document.querySelector('main').style.opacity = 1;

    deepLinkView();
  });
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(y, m - 1, d);
  return d3.timeFormat('%b %d, %Y')(date);
}

function renderIntro(categories, date) {
  const categoryCount = globalCounts['Category Count'];
  const subcategoryCount = globalCounts['Subcategory Count'];

  document.getElementById('category-count').textContent = categoryCount;
  document.getElementById('subcategory-count').textContent = subcategoryCount;
  document.getElementById('update-date').textContent = date;

  const iconsContainer = document.getElementById('category-icons');
  categories.forEach((cat) => {
    const icon = CATEGORY_ICONS[cat];
    if (!icon) return;
    const item = document.createElement('div');
    item.className = 'category-icon-item';
    item.innerHTML = `<img src="assets/icons/${icon}.svg" alt="" aria-hidden="true" width="20" height="20"><span>${cat}</span>`;
    iconsContainer.appendChild(item);
  });

  const introEl = document.getElementById('intro-body');
  introEl.innerHTML = `The Data Grid collects the most important crisis data per <strong>locations with a Humanitarian Response Plan</strong>. The core data are clustered in <strong>${categoryCount} categories</strong> and <strong>${subcategoryCount} sub-categories</strong>. Data may be included in the Data Grid if it is relevant to the sub-category, sub-national, has broad geographic coverage, and is shared in a commonly used format. If a dataset on HDX meets these criteria, it is then marked <strong>'available and up-to-date'</strong> or <strong>'available'</strong> according to the assessment of its update frequency set by the contributing organization. If a dataset does not meet the above criteria or it has not been shared on HDX, the referring sub-category is considered <strong>'unavailable'</strong>.`;

  const expandLink = document.getElementById('intro-expand');
  const desktopMQ = window.matchMedia('(min-width: 80rem)');
  let expanded = false;

  function renderIntroText() {
    if (desktopMQ.matches) {
      introEl.classList.remove('is-clamped');
      expandLink.style.display = 'none';
      return;
    }
    introEl.classList.toggle('is-clamped', !expanded);
    expandLink.innerHTML = expanded
      ? `Show less ${chevronUp}`
      : `Show more ${chevronDown}`;
    expandLink.style.display = '';
  }

  expandLink.addEventListener('click', (e) => {
    e.preventDefault();
    expanded = !expanded;
    renderIntroText();
  });

  desktopMQ.addEventListener('change', () => {
    expanded = false;
    renderIntroText();
  });

  renderIntroText();
}

function normalizePercentages(a, b, c) {
  let complete = Math.round(parseFloat(a) * 100);
  let incomplete = Math.round(parseFloat(b) * 100);
  let noData = Math.round(parseFloat(c) * 100);
  const sum = complete + incomplete + noData;
  if (sum !== 100) {
    const diff = 100 - sum;
    if (complete >= incomplete && complete >= noData) complete += diff;
    else if (incomplete >= complete && incomplete >= noData) incomplete += diff;
    else noData += diff;
  }
  return { complete, incomplete, noData };
}

function getGlobalTotals() {
  return normalizePercentages(
    globalCounts['Rounded Total Percentage Data Complete'],
    globalCounts['Rounded Total Percentage Data Incomplete'],
    globalCounts['Rounded Total Percentage No Data']
  );
}

function renderOverview() {
  const totals = getGlobalTotals();
  renderGlobalBar(document.getElementById('global-bar'), totals, COLORS);
}

function sortCountries(countries) {
  const sorted = [...countries];
  if (sortMode === 'az') {
    sorted.sort((a, b) => a['Location'].localeCompare(b['Location']));
  } else if (sortMode === 'za') {
    sorted.sort((a, b) => b['Location'].localeCompare(a['Location']));
  } else if (sortMode === 'unavailable') {
    sorted.sort((a, b) => parseFloat(b['Percentage No Data']) - parseFloat(a['Percentage No Data']));
  } else if (sortMode === 'updated') {
    sorted.sort((a, b) => parseFloat(b['Percentage Data Complete']) - parseFloat(a['Percentage Data Complete']));
  }
  return sorted;
}

function renderCountryGrid(countries) {
  const grid = document.getElementById('country-grid');
  grid.innerHTML = '';
  grid.classList.remove('expanded');
  document.getElementById('show-more-wrap').style.display = '';

  const sorted = sortCountries(countries);

  sorted.forEach(row => {
    const iso3 = row['ISO3'];
    const name = row['Location'];
    const datasetCount = row['Unique Dataset Count'];

    const { complete, incomplete, noData } = normalizePercentages(
      row['Percentage Data Complete'],
      row['Percentage Data Incomplete'],
      row['Percentage No Data']
    );

    const card = document.createElement('div');
    card.className = 'country-card';
    card.dataset.country = iso3;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-info">
          <div class="card-name">${name}</div>
          <div class="card-datasets">${datasetCount} datasets</div>
        </div>
        <img class="flag" src="assets/flags/${iso3}.png" alt="${name} flag" />
      </div>
      <div class="card-bar"></div>
    `;

    const flagImg = card.querySelector('.flag');
    flagImg.addEventListener('error', () => {
      flagImg.src = 'assets/flags/default.png';
    });

    card.addEventListener('click', () => {
      window.open('https://data.humdata.org/group/' + iso3.toLowerCase(), '_blank');
    });

    grid.appendChild(card);

    renderCountryBar(
      card.querySelector('.card-bar'),
      { complete, incomplete, noData },
      COLORS
    );
  });
}

function setupSortControls() {
  const sortBtns = document.querySelectorAll('.sort-btn');
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sortMode = btn.dataset.sort;
      if (allCountries.length) renderCountryGrid(allCountries);
    });
  });

  document.getElementById('show-more-btn').addEventListener('click', () => {
    document.getElementById('country-grid').classList.add('expanded');
    document.getElementById('show-more-wrap').style.display = 'none';
  });
}

function setupTooltip() {
  const tooltip = document.querySelector('.tooltip-custom');
  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display !== 'none') {
      tooltip.style.left = e.pageX + 'px';
      tooltip.style.top  = e.pageY + 'px';
    }
  });
}

function setupLegendDrawer() {
  const drawer  = document.getElementById('legend-drawer');
  const overlay = document.getElementById('legend-overlay');
  const openBtn = document.querySelector('.legend-toggle-btn');
  const closeBtn = document.getElementById('legend-drawer-close');

  function open() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  const navSelect = document.querySelector('.legend-drawer-nav-select');
  navSelect.addEventListener('change', function() {
    const target = document.getElementById(this.value);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.value = '';
  });

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

function deepLinkView() {
  try {
    const parentHash = window.parent.location.hash;
    if (parentHash) window.location.href = parentHash;
  } catch (e) {
    // cross-origin — ignore
  }
}
