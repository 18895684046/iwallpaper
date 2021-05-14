/**
 * Unsplash API plugin for Vue.js
 *
 * @version 3.0.0
 * @author Charlie LEDUC <contact@graphique.io>
 */

const _BASEURL_ = 'https://api.unsplash.com';
const _accessKey = 'your key';
const _caches = {
  collections: {},
  images: []
};
function _get(endpoint) {
  return new Promise((resolve, reject) => {
    if (window.fetch) {
      fetch(_BASEURL_ + endpoint).then(response => {
        return response.json();
      }).then(json => {
        resolve(json);
      }).catch(error => {
        reject(error);
      });
    } else {
      var req = new XMLHttpRequest();
      req.open('GET', _BASEURL_ + endpoint, true);
      req.responseType = 'json';
      req.onload = evt => {
        resolve(req.response);
      };
      req.onerror = evt => {
        reject(evt);
      };
      req.send();
    }
  });
}

export default {
      getPhotos(page, perPage, orderBy) {
        if (!page || isNaN(page)) page = 1;
        if (!perPage || isNaN(page)) perPage = 10;
        const orders = ['latest', 'oldest', 'popular'];
        if (!orderBy || orders.indexOf(orderBy) < 0) orderBy = 'latest';

        return new Promise((resolve, reject) => {
          _get(`/photos?page=${page}&per_page=${perPage}&order_by=${orderBy}&client_id=${_accessKey}`).then(json => {
            resolve(json);
          }).catch(e => {
            reject(e);
          });
        });
      },
      getPhoto(id) {
        return new Promise((resolve, reject) => {
          const i = _caches.images.findIndex(image => image.id === id);
          if (i > -1) {
            resolve(_caches.images[i]);
            return;
          }
          _get(`/photos/${id}?client_id=${_accessKey}`).then(json => {
            _caches.images.push(json);
            resolve(json);
          }).catch(e => {
            reject(e);
          });
        });
      },
      random(count, orientation) {
        if (!count || isNaN(count) || count > 30) count = 1;

        const orientations = ['landscape', 'portrait', 'squarish'];
        if (!orientations || orientations.indexOf(orientation) < 0) orientation = null;

        return new Promise((resolve, reject) => {
          var params = `count=${count}`;
          if (orientation) params += `&orientation=${orientation}`;
          _get(`/photos/random?${params}&client_id=${_accessKey}`).then(json => {
            resolve(json);
          }).catch(e => {
            reject(e);
          });
        });
      },
      getCollection(id,page,perPage) {
        return new Promise((resolve, reject) => {
          _get(`/collections/${id}/photos?page=${page}&per_page=${perPage}&client_id=${_accessKey}`).then(json => {
            resolve(json);
          }).catch(e => {
            reject(e);
          });
        });
      },
      searchPhoto(query,page,perPage) {
        return new Promise((resolve, reject) => {
          _get(`/search/photos/?query=${query}&page=${page}&per_page=${perPage}&orientation=landscape&client_id=${_accessKey}`).then(json => {
            resolve(json);
          }).catch(e => {
            reject(e);
          });
        });
      },
      randomFrom(list) {
        if (!list || !list.length) {
          return {};
        }
        var i = Math.floor(Math.random() * Math.floor(list.length));
        return list[i];
      }
};
