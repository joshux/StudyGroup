var $ = require('jquery');
var uriAnchor = require('urianchor');
var _ = require('lodash');

var configMap = {
  main_html: String()
    + '<div class="spa-shell-head">'
      + '<div class="spa-shell-head-logo"></div>'
      + '<div class="spa-shell-head-acct"></div>'
      + '<div class="spa-shell-head-search"></div>'
    + '</div>'
    + '<div class="spa-shell-main">'
      + '<div class="spa-shell-main-nav"></div>'
      + '<div class="spa-shell-main-content"></div>'
    + '</div>'
    + '<div class="spa-shell-foot"></div>'
    + '<div class="spa-shell-chat"></div>'
    + '<div class="spa-shell-modal"></div>',
    chat_extend_time: 1000,
    chat_retract_time: 300,
    chat_extend_height: 450,
    chat_retract_height: 15,
    chat_extended_title: 'Click to retract',
    chat_retracted_title: 'Click to extend',
    anchor_schema: { 
      chat: { open: true, closed: true }
    }
};
var stateMap = { 
  $container: null,
  is_chat_retracted: true,
  anchorMap: {}
};
var jqueryMap = {};// no need {}?
var setJqueryMap = function(){
  var $container = stateMap.$container;
  jqueryMap = { 
    $container: $container,
    $chat: $container.find('.spa-shell-chat')
  };
};

var toggleChat = function(do_extend, callback){
  var px_chat_height = jqueryMap.$chat.height();
  var is_open = px_chat_height === configMap.chat_extend_height;
  var is_closed = px_chat_height === configMap.chat_retract_height;
  var is_sliding = !is_open && !is_closed;

  if(is_sliding)
    return false;

  if(do_extend){
    jqueryMap.$chat.animate(
      { height: configMap.chat_extend_height },
      configMap.chat_extend_time,
      function(){
        jqueryMap.$chat.attr('title', configMap.chat_extended_title);
        stateMap.is_chat_retracted = false;
        if(callback) callback(jqueryMap.$chat);
      }
    );
    return true;
  }

  jqueryMap.$chat.animate(
    { height: configMap.chat_retract_height },
    configMap.chat_retract_time,
    function(){
      jqueryMap.$chat.attr('title', configMap.chat_retracted_title);
      stateMap.is_chat_retracted = true;
      if(callback) callback(jqueryMap.$chat);
    }
  );

  return true;
};

var onClickChat = function(event){
  changeAnchor({chat: (stateMap.is_chat_retracted ? 'open':'closed') });
  return false;
};

var changeAnchor = function(anchorMap){
  var newAnchorMap = _.cloneDeep(stateMap.anchorMap);
  _.forEach(anchorMap, function(v, k){
    if(v.indexOf('_') === 0)
      return;
    newAnchorMap[k] = v;
    var k_dep = '_' + k;
    var s_k_dep = '_s' + k_dep;
    delete newAnchorMap[s_k_dep];// no use for setAnchor

    if(anchorMap[k_dep]){
      newAnchorMap[k_dep] = _.clone(anchorMap[k_dep]); // shallow ok
    } else{
      delete newAnchorMap[k_dep];
    }
  });
  try{
    uriAnchor.setAnchor(newAnchorMap);
  } catch(e){
    uriAnchor.setAnchor(stateMap.anchorMap, null, true);
    return false;
  }
  return true;
};

var onHashChange = function(){
  var newAnchorMap;
  try{
    newAnchorMap = uriAnchor.makeAnchorMap();
  } catch(e){
    uriAnchorMap.setAnchor(stateMap.anchorMap, null, true);
    return false;
  }
  var oldAnchorMap = _.cloneDeep(stateMap.anchorMap);
  stateMap.anchorMap = newAnchorMap;
  
  //utilize chat state change
  var diff = diffAnchorMap(newAnchorMap, oldAnchorMap, 'chat');
  if(diff){
    if(diff === 'open'){
      toggleChat(true);
    }
    else if(diff === 'closed'){ // 'closed1' error
      toggleChat(false);
    }
    else{
      stateMap.anchorMap = oldAnchorMap;
      uriAnchor.setAnchor(stateMap.anchorMap, null, true); // book error?
      return false;
    }
  }
  return true;
};

var diffAnchorMap = function(newAnchorMap, oldAnchorMap, key){
  var key_dep = '_' + key;
  var s_key_dep = '_s' + key_dep;

  if(newAnchorMap[s_key_dep] && newAnchorMap[s_key_dep] !== oldAnchorMap[s_key_dep])
    return newAnchorMap[s_key_dep];
  else
    return false;
};

module.exports = {
  initModule: function($container){
    stateMap.$container = $container;
    $container.html(configMap.main_html);
    setJqueryMap();

    stateMap.is_chat_retracted = true;
    jqueryMap.$chat
      .attr('title', configMap.chat_retracted_title)
      .click(onClickChat);

    uriAnchor.configModule({
      schema_map: configMap.anchor_schema
    });

    $(window).bind('hashchange', onHashChange).trigger('hashchange');
  }
};
