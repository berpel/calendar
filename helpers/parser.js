
var jsdom = require('jsdom')
  , request = require('request')
  , url = require('url')
  , randomColor = require('randomColor');

var CONST_cities = ['jacksonville', 'philadelphia', 'boston', 'new york city', 'los angeles', 'san fransico', 'chicago', 'seattle', 'austin', 'atlanta', 'orlando', 'west palm'];

module.exports = (function() {

  function getIcons(data, old_text) {
    var icons = [];
    var text = old_text.replace(/\((.+?)\)/g, function($0, $1) { icons.push($1); return ''; })
    data.text = text;
    return icons;
  }

  function getTime(data, text) {
    return;
  }

  function getText(text) {
    return text;
  }

  function getLocation(text) {
    var map = null;
    text = text.toLowerCase();
    for (var i = 0; i < CONST_cities.length; i++) {
      found = text.indexOf(CONST_cities[i]);
      console.log(found);
      if (found > -1) {
        map = 'http://maps.googleapis.com/maps/api/staticmap?center='+CONST_cities[i]+'&zoom=13&size=300x300';
        console.log(map);
      }
    }
    return map;
  }

  function getArticle(urls, callback) {
    
    var getTitle = function(article, link_parsed, $) {

        var title = $('title').text();
        if(title == null || title.length == 0) {
          title = article.url;
        }
        title = title.trim();
        return title;
    };
    
    var getSummary = function (article, link_parsed, $) {
      summary = $('meta[property="og:description"]').attr('content');
      if(summary == null || summary.length == 0) {
        summary = $('meta[name="description"]').attr('content');
      }
      if(summary == null || summary.length == 0) {
        summary = $('meta[name="Description"]').attr('content');
      }
      if(summary != null) {
        if(summary.length > 200) {
          summary = summary.substring(0, 196) + ' ...';
        }
      }
      return summary;
    };

    var getPhoto = function(article, link_parsed, $) {
      var image_url = $('meta[property="og:image"]').attr('content');
      if(image_url == null || image_url.length == 0) {
        image_url = $('meta[itemprop="image"]').attr('content');
      }
      if(image_url == null || image_url.length == 0) {
        try {
          image_url = $('link[rel="fluid-icon"]').attr('href');
        } catch(e) {}
      }
      if(image_url == null || image_url.length == 0) {
        image_url = $('link[rel="apple-touch-icon-precomposed"]').attr('href');
      }
      if(image_url == null || image_url.length == 0) {
        var found_size = 0;
        var all_images = $('img').each(function(index, img) {
          console.log(img.width + ' - ' + img.height);
          if(img.width > 100 && img.height > 100) {
            var size = img.width * img.height;
            if(size > found_size) {
              image_url = $(img).attr('src');
              found_size = size;
            }
          }
        });
      }
      if(image_url == undefined || image_url.length == 0) {
        //logger.info('image_url is empty: ignoring');
        return undefined;
      }
      if(image_url.substring(0, 2) == '//') {
        image_url = link_parsed.protocol + image_url;
      } else if(image_url.substring(0, 4) != 'http') {
        image_url = link_parsed.protocol + '//' + link_parsed.hostname + '/' + image_url;
      }
      return image_url;
    }

    link_parsed = url.parse(urls[0]);

    request({ uri : urls[0] }, function (error, response, body) {
      jsdom.env({
        html: body,
        scripts: [
          'http://code.jquery.com/jquery-2.1.1.min.js'
        ],
        done: function (error, window) {
          if(error) {
            console.log('dun f\'ed up');
          }
          var $ = window.jQuery;
          var article = {};
          article.url = urls[0];
          article.title = getTitle(article, link_parsed, $);
          article.summary = getSummary(article, link_parsed, $);
          article.image = getPhoto(article, link_parsed, $);
          
          //console.log('----- article -----');
          //console.log(article);

          return callback(article);
        }
      });
    });
  }

  return {
    parse: function(text, callback) {
      var data = {}
      data.original = text;
      data.type = 'default';
      data.text = getText(text);
      data.icons = getIcons(data, text);
      data.background = randomColor();
      data.article = {};

      var regex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
      var urls = text.match(regex);
      //console.log('---- urls -----')
      //console.log(urls);
      if (urls) {
        getArticle(urls, function(res){
          if (res) {
            data.type = 'article';
            data.article = res;
          }
          
          console.log('---- finished data ----')
          console.log(data);
          return callback(data);
        });
      } else {

        map = getLocation(text);
        //console.log(map);
        if (map) {
          data.type = 'article';
          data.article.image = map;
        }

        return callback(data);
      }
      
    }
  }

})();