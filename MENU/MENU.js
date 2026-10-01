/**
 * Reitansai Radial Menu + Hamburger FAB
 * Base path: always /reitansai/ on GitHub Pages
 */
(function () {
  'use strict';

  /** Site root under GitHub Pages project site */
  function getBase() {
    var p = location.pathname || '';
    if (p.indexOf('/reitansai/') === 0 || p === '/reitansai') return '/reitansai/';
    if (location.protocol === 'file:') {
      var depth = (p.match(/\/pages\/seminars\//) ? 2 : p.match(/\/pages\//) ? 1 : 0);
      return depth === 2 ? '../../' : depth === 1 ? '../' : './';
    }
    return '/reitansai/';
  }

  var BASE = getBase();

  function url(path) {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) === '/') {
      return path.indexOf('/reitansai') === 0 ? path : '/reitansai' + path;
    }
    return BASE + path.replace(/^\.\//, '');
  }

  function buildMenuData() {
    return [
      { label: 'ホーム', icon: '🏠', url: url('index.html') },
      { label: 'スケジュール', icon: '📅', url: url('pages/schedule.html') },
      { label: 'Myスケジュール', icon: '⭐', url: url('pages/my/my_schedule.html') },
      { label: '会場マップ', icon: '🗺️', url: url('pages/venue.html') },
      { label: '振り返り', icon: '📝', url: url('pages/feedback.html') },
      {
        label: 'ゼミ一覧', icon: '🎓', items: [
          { label: 'データサイエンス探究AI', icon: '📊', url: url('pages/seminars/データサイエンス探究AIゼミ.html') },
          { label: '教育ゼミ', icon: '📚', url: url('pages/seminars/教育ゼミ.html') },
          { label: '国際地域研究', icon: '🌍', url: url('pages/seminars/国際地域研究ゼミ.html') },
          { label: '文芸小説創作', icon: '✍️', url: url('pages/seminars/文芸小説創作ゼミ.html') },
          { label: '化学ゼミ', icon: '⚗️', url: url('pages/seminars/化学ゼミ.html') },
          { label: '文学ゼミ', icon: '📖', url: url('pages/seminars/文学ゼミ.html') },
          { label: 'メディアゼミ', icon: '📡', url: url('pages/seminars/メディアゼミ.html') },
          { label: '社会ゼミ', icon: '🏛️', url: url('pages/seminars/社会ゼミ.html') },
          { label: '農業ゼミ', icon: '🌱', url: url('pages/seminars/農業ゼミ.html') },
          { label: '観光ゼミ', icon: '🗺️', url: url('pages/seminars/観光ゼミ.html') },
          { label: '語学ゼミ', icon: '🗣️', url: url('pages/seminars/語学ゼミ.html') },
          { label: '遊びの探究', icon: '🎮', url: url('pages/seminars/遊びの探究ゼミ.html') },
          { label: 'デジタルコンテンツ制作', icon: '💻', url: url('pages/seminars/デジタルコンテンツ制作ゼミ.html') },
          { label: '映像編集', icon: '🎬', url: url('pages/seminars/映像編集ゼミ.html') },
          { label: 'イベント企画', icon: '🎉', url: url('pages/seminars/イベント企画ゼミ.html') },
          { label: '道徳ゼミ', icon: '☯️', url: url('pages/seminars/道徳ゼミ.html') }
        ]
      },
      { label: 'ゼミトップ', icon: '📋', url: url('pages/seminars/index.html') },
      { label: 'About', icon: 'ℹ️', url: url('pages/about_This_Site.html') },
      { label: 'サイトマップ', icon: '🗺️', url: url('sitemap.html') }
    ];
  }
