var scheduledTalks = [];
var talksElement = $('#talks');
var talkTemplateElement = $('#talk-template');
var talksUrl = 'https://websummit.cloudant.com/websummit2014/_all_docs?include_docs=true';
var filterCriteria = {
  date: 'nov5'
};
var showingRememberedTalks = false;

var transformTalks = function(rawData) {
  console.log(rawData[0]);
  return rawData.rows.filter(function(row) {
    return row.doc.type && row.doc.type.name == 'talk' && row.doc.summit && row.doc.summit.value;
  }).map(function(row) {
    var hoursAndMinutes = row.doc.start_time.split(':');
    return {
      id: row.id,
      title: row.doc.title,
      description: row.doc.description,
      start_time: row.doc.start_time,
      start_time_numeric: parseInt(hoursAndMinutes[0], 10) + (parseInt(hoursAndMinutes[1], 10) / 60),
      end_time: row.doc.end_time,
      location: row.doc.summit.name,
      locationId: row.doc.summit.value,
      date: row.doc.date.value,
      speakers: row.doc.speakers
        .filter(function(item) { return item && item.speaker; })
        .map(function(item) { return item.speaker.name; })
        .join(', ')
    }
  });
};

var filterAndRenderTalks = function() {
  var filteredTalks = filterTalks(scheduledTalks);
  renderTalks(filteredTalks);
};

var renderTalks = function(talks) {
  window.scrollTo && window.scrollTo(0, 0);
  var rememberedTalkIds = getRememberedTalkIds();
  var talksContent = '';
  var talkTemplate = talkTemplateElement.html();
  talks.forEach(function(talk) {
    var isRememberedTalk = rememberedTalkIds.indexOf(talk.id) > -1;
    var action = isRememberedTalk ? 'forget' : 'remember';
    talksContent += talkTemplate
      .replace(/\{\{id\}\}/g, talk.id)
      .replace(/\{\{action\}\}/g, action)
      .replace('{{start_time}}', talk.start_time)
      .replace('{{end_time}}', talk.end_time)
      .replace('{{title}}', talk.title)
      .replace('{{location}}', talk.location)
      .replace('{{description}}', talk.description)
      .replace('{{speakers}}', talk.speakers);
  });
  talksElement.html(talksContent);
}

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
    return (order == 1) ? a[key] - b[key] : b[key] - a[key];
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
    if (talkIds.length > 1)
      talkIds = talkIds.splice(indexOf, 1);
    else
      talkIds = [];
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
    sortTalks('start_time_numeric', 1);
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
    sortTalks('start_time_numeric', 1);
  }
  else if (sortCriteria == 'time_desc') {
    sortTalks('start_time_numeric', -1);
  }
  else {
    sortTalks(sortCriteria, 1);
  }
  filterAndRenderTalks();
});

$('#show-remembered-talks').click(function() {
  showingRememberedTalks = true;
  var talkIds = getRememberedTalkIds();
  var talksToRender = scheduledTalks.filter(function(talk) {
    return talkIds.indexOf(talk.id) > -1;
  });
  renderTalks(talksToRender);
});

$('#show-schedule').click(function() {
  showingRememberedTalks = false;
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
  if (showingRememberedTalks) {
    button.closest('.talk').remove();
  }
  else {
    button.removeClass('forget-talk').addClass('remember-talk').html('remember talk');
  }
});

$(document).on('click', '.toggle-description', function(event) {
  var talk = $(this).closest('.talk');
  talk.find('.description').toggle();
  return false;
});