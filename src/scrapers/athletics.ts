PS C:\Users\sprin\nmhu-test> npx playwright test inspect-archive-items.spec.js --reporter=list

Running 1 test using 1 worker

     1 inspect-archive-items.spec.js:3:1 › Find individual archive items

========== ARCHIVE ITEMS ==========
{
  "patterns": {
    "divs": 0,
    "links": 31,
    "lists": 9,
    "articles": 0
  },
  "sampleLinks": [
    {
      "text": "RMAC Releases Softball Preseason Poll",
      "href": "/news/2026/1/22/rmac-releases-softball-preseason-poll.aspx",
      "class": ""
    },
    {
      "text": "Coach Kali Pugh Announces First NMHU Signing Class",
      "href": "/news/2025/8/13/softball-coach-kali-pugh-announces-first-nmhu-signing-class.aspx",
      "class": ""
    },
    {
      "text": "Kali Pugh Named NMHU Softball Coach",
      "href": "/news/2025/5/28/kali-pugh-named-nmhu-softball-coach.aspx",
      "class": ""
    },
    {
      "text": "New Mexico Highlands University Names New Athletic Director",
      "href": "/news/2025/5/27/general-new-mexico-highlands-university-names-new-athletic-director.aspx",
      "class": ""
    },
    {
      "text": "Cowgirls Drop Two in Day One in Golden",
      "href": "/news/2025/4/25/softball-cowgirls-drop-two-in-day-one-in-golden.aspx",
      "class": ""
    }
  ],
  "possibleItems": [
    {
      "tag": "HEADER",
      "class": "sidearm-archives-header sidearm-common-header flex row flex-column large-flex-row noprint",
      "text": "Search...  Sports Dropdown All Sports  BaseballFootballGeneralMen's BasketballMen's Cross CountryMen's RodeoSoftballVolleyballWomen's BasketballWomen'"
    },
    {
      "tag": "UL",
      "class": "sidearm-archives-select-list sidearm-common-header-select-list flex flex-column medium-flex-row flex-item-1",
      "text": "Search...  Sports Dropdown All Sports  BaseballFootballGeneralMen's BasketballMen's Cross CountryMen's RodeoSoftballVolleyballWomen's BasketballWomen'"
    },
    {
      "tag": "LI",
      "class": "sidearm-archives-select-filter flex flex-item-1",
      "text": "Search..."
    }
  ],
  "innerHTML": "<div class=\"sidearm-common-promotion\"><ads-component params=\"{name : 'archives-above-header-1'}\"><!-- ko ifnot: isInitializing() -->\n\n    <!-- ko switch -->\n\n        <!-- ko case: ad.location.type === 'single' --><!-- /ko -->\n\n        <!-- ko case: ad.location.type === 'multi' --><!-- /ko -->\n\n        <!-- ko case: ad.location.type === 'html' --><!-- /ko -->\n\n        <!-- ko case: ad.location.type === 'icons' --><!-- /ko -->\n\n        <!-- ko case: ad.location.type === 'dfp' --><!-- /ko -->\n\n    <!-- /ko -->\n\n<!-- /ko --></ads-component></div> <h2>Story Archives</h2> <header class=\"sidearm-archives-header sidearm-common-header flex row flex-column large-flex-row noprint\"><ul class=\"sidearm-archives-select-list sidearm-common-header-select-list flex flex-column medium-flex-row flex-item-1\"><li class=\"sidearm-archives-select-filter flex flex-item-1\"><label for=\"vue-archives-input\" class=\"hide\">Search...</label> <input id=\"vue-archives-input\" placeholder=\"Search...\" class=\"flex-item-1\"></l"
}
  ✓  1 inspect-archive-items.spec.js:3:1 › Find individual archive items (7.8s)

  1 passed (8.9s)