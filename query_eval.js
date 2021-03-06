var url = '/select/?start=0&rows=100&debugQuery=true';
var luke = '/admin/luke?show=schema&wt=json&json.wrf=?&indent=true';
var status = 'admin/cores?action=STATUS&wt=json&json.wrf=?'

var search_result = '';

var slider_weight = 1000;

var doc_fields = ['score' ];

var solr = "datanode29.companybook.no:8080/solr/";
var current_shard = '  '

var solr_schema = null;
var click_data = null;
var query_fields = {};

function display_query_explain(){
    $('#debug').html(search_result.debug.parsedquery);
}

function do_search(){
      $("#result_list").children().remove();
         $.ajax(
         {
             url: build_query(),
             dataType: 'json',
             data: {},
             success: function(result) {
                 search_result = result;
                 display_header();
                 display_query_explain();
                 
                 for (var i = 0; i < result.response.docs.length; i++) {
                     display_document(result.response.docs[i] , i);
                 }               
             },
             error: function(e) {
                 alert('error performing search');
                     search_complete = true;
                 }       
             }        
         );
}

function showValue(newValue)
{
	document.getElementById("range").innerHTML=newValue;
}

function equalizer_change_callback(e){
    
    var rank_value =  $(this).attr('value') / slider_weight;
    var rank_field =  $(this).data('field-name');
    
    // console.log(query_fields);
    
    query_fields[rank_field] = rank_value;
    save_json('eq_fields', query_fields);
    
    do_search();
}

function equalizer_create_callback(e){
    
    var fieldName = get_clicker(this);
    
    if(query_fields[fieldName]){
        delete query_fields[fieldName];    
    }else{
        query_fields[fieldName] = 0.01 ;
    }
    save_json('eq_fields', query_fields);
    
    $('#eq').children().remove();
     load_equalizer();    
}

function create_equalizer(field_name){     
    $('#eq').append('<p>' + field_name +  '&nbsp;&nbsp;<input type="range" min="0" max="10000" precision="1" step="1" value="' + query_fields[field_name] * slider_weight + '" data-field-name="' + field_name  + '" title="' + field_name +  '"/></p>');
}

function load_equalizer(){
    
    query_fields = load_json('eq_fields');
    for(var field in query_fields) {
        create_equalizer(field);
    }    
}

function show_click_callback(e){
    var fieldName = get_clicker(this);                
    
    if($(this).data('status') == 'show'){
        $(this).data('status', 'hide');    
        $(this).text('Hide')
        
         doc_fields.push(fieldName); 
    }
    else {
        $(this).text('Show')
        $(this).data('status', 'show');    
        doc_fields.pop(fieldName);              
    }   
        save_display_fields();     
        do_search();
}

function change_shard_callback(e){
    
    current_shard =  $(this).attr('value') ;
    initialize();
}

function load_shards(){
    var shard = $('#shard');
    $(shard).children().remove();
    $.ajax(
     {
         url: 'http://'+ solr + status,
         dataType: 'json',
         data: {},
         success: function(result) {
            for(var core in result.status){
                $(shard).append('<option value="' +core+ '">' + core +'</option>');
            }                    
         },
         error: function(e) {
             alert('error loading shards');
                 search_complete = true;
             }       
         }        
     );
}

function clear(){
    var items =  [$("#field_list"), $('#eq'),$("#result_list")];
    $.each(items, function(it){$(this).children().remove();})    
}

function initialize(){
    clear();
    load_solr_schema();
    load_display_fields();
    load_equalizer();
    display_fields();
}

$(document).ready(function() {
    
    initialize();
    load_shards();
    
    $('#function_query').change(function(e){
        var f =  $(this).val(); 
        if(f.length > 0){
            do_search();
        }    
    });
    
    $('#server_url').val(solr) //TODO:handle when server url changes
    $('#shard').change(change_shard_callback);
    $('#shard option[value=no_companies_20120207]').attr('selected', 'selected');
    $('#eq > p > input').live('change', equalizer_change_callback );    
    $('.btn-group .eq').live('click', equalizer_create_callback);
    $('.btn-group .show').live('click', show_click_callback );

    $('#search > form').submit(function(e) {
        e.preventDefault();
       
        var query = $("#search_text").val()
        if (query.length == 0) {
            alert('search for something...')
            return false
        }
       do_search();
    });
});

function get_clicker(button){
    $(button).button('toggle');
    return $(button).closest('tr').find('td').first().text();
}

function display_fields(){

    var table =  $("#field_list");    
    $("#field_list").children().remove();    
    var header_text = ['Field', "Display"];
    
    var header = document.createElement('thead');
    var row =  document.createElement('tr');
    header.appendChild(row);
    
    $.each(header_text ,function(index ,fieldName){
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(fieldName));
        row.appendChild(th); 
    });

    table.append(header);

    // console.log(solr_schema.schema.fields);
    if(solr_schema == undefined || solr_schema.fields == 'undefined'){
        return;
    }
    var field = '';
    for(field in solr_schema.schema.fields){
        
        var row = document.createElement('tr');
        $(row).data('field', field);
        
            var name = document.createElement('td');
            name.appendChild(document.createTextNode(field));
            row.appendChild(name);                    

            var radioSection =  document.createElement('td');
            
            if(doc_fields.indexOf (field)>-1 ){
                $(radioSection).html('<div class="btn-group" dataType-toggle="buttons-checkbox"><button class="btn show btn-primary" data-field="' + field +'" data-status="hide">Hide</button><button class="btn eq btn-primary" data-status="enabled">Searchalize</button></div>');
                    // console.log( get_clicker($("button[data-field='" + field + "']")));

            }else{
                $(radioSection).html('<div class="btn-group" dataType-toggle="buttons-checkbox"><button class="btn show btn-primary" data-field="' + field +'" data-status="show">Show</button><button class="btn eq btn-primary" data-status="enabled">Searchalize</button></div>');
            }
            
        row.appendChild(radioSection);                    
        table.append(row);
    }
}

function load_solr_schema(){

            // var schema = JSON.parse(localStorage.getItem(solr+'_schema')); 
            var schema = load_json('schema');
            console.log (schema);
                        if(schema['schema']){
                            console.log('have schema for ' + current_shard)
                            solr_schema = schema;
                            return;
                        }


            $.ajax({
    	       url:'http://' + solr + current_shard + luke,
    	        dataType: 'json',
    	       success: function(data){
                   // var json_schema = JSON.stringify(data);
                   // console.log('saving schema for ' + current_shard);
                   save_json('schema', data);
                   
                   solr_schema = data;
                   
                   display_fields();
    	       } 
    	    });    	    
}

function save_display_fields(){
    save_json('display',doc_fields);
}

function save_json(key, json){
    var json_fields = JSON.stringify(json);
    localStorage.setItem(solr + current_shard +'_' + key, json_fields);
}

function load_json(key, default_value){
    
    if (typeof(localStorage) == 'undefined' ) {
    	alert('Your browser does not support HTML5 localStorage. Try upgrading.');
    	return
    }
    
    default_value = (typeof default_value == 'undefined') ?
            {}: default_value;
    
         
    var json = JSON.parse(localStorage.getItem(solr + current_shard +'_' + key)); 
    
    if(json != null){
        return json;
    }   
    
    return default_value; 
}

function load_display_fields(){    
      doc_fields = load_json('display', ['score']);
 }

function get_query_fields (){
    var fields = [];
    
            $.each(query_fields, function(field_name,boost_value){
                var f = field_name + '^' + boost_value;
                fields.push(f);
            });
        
        if(fields.length > 0){
            // return  '&qf=' +  fields.join('+') +'&pf='+ fields.join('+')  ;            
            return  '&qf=' +  fields.join('+') +'&pf='  ;
        }

        
    return ''
}

function get_boost_function(){
    var boost_function = $('#function_query').val();
    
    if(boost_function.length > 0){
        return '&bf=' + boost_function 
    }else{
        console.log('bf empty');    
    }


}

function build_query(){
    // console.log('build query')
    
    var query = $("#search_text").val()
    var fl = "&fl=" 

    $.each(doc_fields, function(index,val){fl += '+'+ val })
    
    var json ='&wt=json&json.wrf=?'
    
    return  "http://" + solr + current_shard + url + fl + get_query_fields() + get_boost_function()+ '&ps=1'   + "&q=" +  query + json;
}

function display_header(){
    var header = document.createElement('thead');
    var row =  document.createElement('tr');
    header.appendChild(row);

    
    var th = document.createElement('th');
    th.appendChild(document.createTextNode('position'));
    row.appendChild(th)

    for(i =0; i< doc_fields.length; i++){
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(doc_fields[i]));
    	row.appendChild(th);        
    }    
    document.getElementById("result_list").appendChild(header);
}

function display_document(doc, index){
//replace to data-item
  
    var row = document.createElement('tr');
    row.setAttribute('id',"result_" + index );
    
    var td = document.createElement('td');

    $(td).html('span class="badge badge-info').text(index + 1); 
	row.appendChild(td);
       
    for(i =0; i< doc_fields.length; i++){
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(doc[doc_fields[i]]));
    	row.appendChild(td);        
    }

document.getElementById("result_list").appendChild(row);
}