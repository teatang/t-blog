'use strict';

hexo.extend.filter.register('after_render:html', function (str) {
  const tags = hexo.locals.get('tags');
  if (!tags || !tags.length) return str;
  
  const data = {};
  tags.forEach(tag => {
    data[tag.name] = tag.length;
  });

  const script = `<script>window.__TAG_DATA__=${JSON.stringify(data)};</script>`;
  return str.replace('<body>', '<body>'+script);
});
