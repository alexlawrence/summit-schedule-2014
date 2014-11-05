var scheduledTalks = [];
var talksElement = $('#talks');
var talkTemplateElement = $('#talk-template');
var talksUrl = 'https://websummit.cloudant.com/websummit2014/_all_docs?include_docs=true';
var filterCriteria = {
  date: 'nov5'
};

var transformTalks = function(rawData) {
  console.log(rawData.rows[0]);
  return rawData.rows.filter(function(row) {
    return row.doc.type && row.doc.type.name == 'talk';
  }).map(function(row) {
    return {
      id: row.id,
      title: row.doc.title,
      description: row.doc.description,
      start_time: row.doc.start_time,
      end_time: row.doc.end_time,
      location: row.doc.summit.name,
      locationId: row.doc.summit.value,
      date: row.doc.date.value
    }
  });
};

var filterAndRenderTalks = function(talks) {
  talks = talks || scheduledTalks;
  var filteredTalks = filterTalks(talks);
  var rememberedTalkIds = getRememberedTalkIds();
  var talksContent = '';
  var talkTemplate = talkTemplateElement.html();
  filteredTalks.forEach(function(talk) {
    var isRememberedTalk = rememberedTalkIds.indexOf(talk.id) > -1;
    var action = isRememberedTalk ? 'forget' : 'remember';
    talksContent += talkTemplate
      .replace(/\{\{id\}\}/g, talk.id)
      .replace(/\{\{action\}\}/g, action)
      .replace('{{start_time}}', talk.start_time)
      .replace('{{end_time}}', talk.end_time)
      .replace('{{title}}', talk.title)
      .replace('{{location}}', talk.location)
      .replace('{{description}}', talk.description);
  });
  talksElement.html(talksContent);
};

var filterTalks = function(talks) {
  return talks.filter(function(talk) {
    for (var key in filterCriteria) {
      if (filterCriteria.hasOwnProperty(key)) {
        if (talk[key] != filterCriteria[key]) return false;
      }
    }
    return true;
  });
};

var sortTalks = function(key, order) {
  scheduledTalks.sort(function(a, b) {
    return order == 1 ? a[key] > b[key] : a[key] < b [key];
  });
};

var rememberTalk = function(talkId) {
  var talkIds = getRememberedTalkIds();
  talkIds.push(talkId);
  localStorage.setItem('rememberedTalkIds', JSON.stringify(talkIds));
};

var forgetTalk = function(talkId) {
  var talkIds = getRememberedTalkIds();
  var indexOf = talkIds.indexOf(talkId);
  if (indexOf > -1) {
    talkIds = talkIds.splice(indexOf, 1);
    localStorage.setItem('rememberedTalkIds', JSON.stringify(talkIds));
  }
};

var getRememberedTalkIds = function() {
  var idsAsString = localStorage.getItem('rememberedTalkIds');
  if (idsAsString == null) idsAsString = '[]';
  return JSON.parse(idsAsString);
};

$(document).ready(function() {
  $.getJSON(talksUrl, function(result) {
    scheduledTalks = transformTalks(result);
    sortTalks('start_time', 1);
    filterAndRenderTalks();
  });
});

$('#filter-location').change(function(event) {
  var locationId = $(event.target).val();
  if (locationId != 'all')
    filterCriteria.locationId = locationId;
  else
    delete filterCriteria.locationId;
  filterAndRenderTalks();
});

$('#filter-date').change(function(event) {
  var date = $(event.target).val();
  filterCriteria.date = date;
  filterAndRenderTalks();
});

$('#sort').change(function(event) {
  var sortCriteria = $(event.target).val();
  if (sortCriteria == 'time_asc') {
    sortTalks('start_time', 1);
  }
  else if (sortCriteria == 'time_desc') {
    sortTalks('start_time', -1);
  }
  else {
    sortTalks(sortCriteria, 1);
  }
  filterAndRenderTalks();
});

$('#show-remembered-talks').click(function() {
  var talkIds = getRememberedTalkIds();
  var talksToRender = scheduledTalks.filter(function(talk) {
    return talkIds.indexOf(talk.id) > -1;
  });
  filterAndRenderTalks(talksToRender);
});

$('#show-schedule').click(function() {
  filterAndRenderTalks();
});

$('#delete-remembered-talks').click(function() {
  localStorage.setItem('rememberedTalkIds', '[]');
  filterAndRenderTalks();
});

$(document).on('click', '.remember-talk', function(event) {
  var button = $(event.target);
  var talkId = button.data('id');
  rememberTalk(talkId);
  button.removeClass('remember-talk').addClass('forget-talk').html('forget talk');
});

$(document).on('click', '.forget-talk', function(event) {
  var button = $(event.target);
  var talkId = button.data('id');
  forgetTalk(talkId);
  button.removeClass('forget-talk').addClass('remember-talk').html('remember talk');
});

$(document).on('click', '.toggle-description', function(event) {
  $(this).closest('.talk').find('.description').toggle();
  return false;
});