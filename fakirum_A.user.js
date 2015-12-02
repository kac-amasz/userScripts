 // ==UserScript==
// @name        fakirum A
// @namespace   http://kac-amasz.com/
// @version     1
// @grant       GM_xmlhttpRequest
// @include     http://localhost/kac/tmp/*
// ==/UserScript==

var parts_servers = ['http://192.168.0.27:3000', 'http://192.168.2.2:3000']

function convertCsv(text) {
  var rows = text.split('\r\n')
  var cols = [0, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 50]
  var ret = []
  for (var i = 0; i < rows.length - 1; i++) {
    var row = rows[i]
    if (i == 0) {
      row = row.slice(0, 30) + 'ść\t' + row.slice(33)
    }
    row = row.split('\t')
    var out = []
    for (var j in cols) {
      var s = row[cols[j]]
      if (i > 0) {
        switch (cols[j]) {
          //console.log(j)
          case 2:
            s = s.replace(/\s/g, '')
            break
          case 4:
          case 6:
          case 7:
          case 9:
          case 10:
          case 11:
          case 12:
            s = parseFloat(s.replace(/\./g, '').replace(/,/, '.'))
            break
          case 5:
            switch (s) {
              case 'SZT':
                s = 'szt.'
                break
            }
            break
          case 50:
            s = 23
            break;
        }
      }
      out.push(s)
    }
    ret.push(out)
  }
  return ret
}

function loadDoc(url, timeout, callback) {
  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    timeout: timeout,
    onload: function(response) {
      callback(null, response.responseText);
    },
    onerror: function(err) {
      console.log('loadDoc error', url, err)
      callback(err, null)
    },
    ontimeout: function(err) {
      console.log('loadDoc timeout', url, err)
      callback(err, null)
    }
  })
}



var href = document.getElementsByTagName('a')[0].href

loadDoc(href, 5000, function(err, data) {
  if (err) return console.log('csv load error', href, err)
  var rows = convertCsv(data)

  rows[0].push('Sprzedaż Netto')
  var rowNum = 1;

  var parts_server = parts_servers.shift()

  function fetchSellPrice(callback) {
    if (rowNum == rows.length) return callback(null, rows)
    loadDoc(parts_server + '/part/' + rows[rowNum][1], 2000, function(err, data) {
      if (err) {
        console.log(err)
        if (parts_servers.length > 0) {
          parts_server = parts_servers.shift()
          return fetchSellPrice(callback)
        }
        return callback(err)
      }
      var part = JSON.parse(data)
      if (part.err) return callback(new Error(err))
      part = part.value
        //console.log(part)
      rows[rowNum].push(part.priceMax)
      rowNum++
      fetchSellPrice(callback)
    })
  }

  fetchSellPrice(function(err, table) {
    if (err) return console.log('step error', rowNum, rows[rownum], err)
    var s = ''
    for (var i in table) {
      s += table[i].join(';') + '\r\n'
    }
    var a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(s)
    a.download = 'faktura-' + new Date().getTime() + '.csv'
    var e = document.createEvent('MouseEvent')
    e.initEvent('click', true, true)
    a.dispatchEvent(e)
  })
})
