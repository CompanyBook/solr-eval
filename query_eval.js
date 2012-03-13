var url = '/select/?start=0&rows=10&debugQuery=true';
var luke = '/admin/luke?show=schema&wt=json&json.wrf=?&indent=true';
var search_result = '';
var doc_fields = [];
//'name', 'score', 'boost_revenue'
var doc_id = 'company_id';
var solr = "datanode29.companybook.no:8080/solr/no_companies_20120207";
var solr_schema = null;
var click_data = null;
var query_fields = {};

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

                 for (var i = 0; i < result.response.docs.length; i++) {
                     display_document(result.response.docs[i]);
                 }
                 console.log('end seach callback')                
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


function do_search_after_slide(){
    do_search();
}

$(document).ready(function() {
    
    load_solr_schema();
    display_fields();
    
    // live
    // finalise
    
    $('#eq > input').live('change', function(e){

    var rank_value =  $(this).attr('value');
    var rank_field =  $(this).data('field-name');
    
    query_fields[rank_field] = rank_value;
    do_search_after_slide();
    
    });
    
    $('.btn-group .show').live('click', function(e){
        
        var fieldName = get_clicker(this);                
        
        if($(this).data('status') == 'show'){
            $(this).data('status', 'hide');    
            $(this).text('Hide')
            
             doc_fields.push(fieldName); 
             do_search();
        }
        else {
            $(this).text('Show')
            $(this).data('status', 'show');    
            doc_fields.pop(fieldName);          
            do_search();
        }        

    });
    
    $('.btn-group .eq').live('click', function(e){
        console.log('Eq ' + get_clicker(this));
        var fieldName = get_clicker(this);
        $('#eq').append('<input type="range" min="0.01" max="10.0" precision="0.5" step="0.1" value="0.1" data-field-name="' + fieldName + '" title="' + fieldName + '" /><span>' + fieldName + '</span><span>0</span>');        
    });    
    
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
    
    var field = ''
    for(field in solr_schema.schema.fields){
        
        var row = document.createElement('tr');
        row.setAttribute('id',"field_" + field);
        
            var name = document.createElement('td');
            name.appendChild(document.createTextNode(field));
            row.appendChild(name);                    

            var radioSection =  document.createElement('td');
            
            if(doc_fields.indexOf (field)>-1 ){
                $(radioSection).html('<div class="btn-group" dataType-toggle="buttons-checkbox"><button class="btn show btn-primary" data-status="hide">Hide</button><button class="btn eq btn-primary" data-status="enabled">Searchalize</button></div>');
            }else{
                $(radioSection).html('<div class="btn-group" dataType-toggle="buttons-checkbox"><button class="btn show btn-primary" data-status="show">Show</button><button class="btn eq btn-primary" data-status="enabled">Searchalize</button></div>');
            }
            
            
            
            
            
            row.appendChild(radioSection);                    
        table.append(row);
    }
}

function load_solr_schema(){
    if (typeof(localStorage) == 'undefined' ) {
    	alert('Your browser does not support HTML5 localStorage. Try upgrading.');
    } else {
    	try {
            // downlod the schema
            // localStorage.removeItem(solr+'_schema');
            solr_schema = JSON.parse(localStorage.getItem(solr+'_schema')); 
            
            if(solr_schema != null){
                console.log('found schema in local storage, skipping ajax call')
                return;
            }
            $.ajax({
    	       url:'http://' + solr + luke,
    	        dataType: 'json',
    	       success: function(data){
                   var json_schema = JSON.stringify(data);
                   console.log('storing schema into local storage')
                   localStorage.setItem(solr+'_schema', json_schema);
    	       } 
    	    });    	    
    	} catch (e) {
    	 	 if (e == QUOTA_EXCEEDED_ERR) {
    	 	 	 alert('Quota exceeded!');
    		}else{
    		     alert(e);
    		}
    		
    	}
    }
}

function get_query_fields (){
    var fields = [];
    
            $.each(query_fields, function(field_name,boost_value){
                var f = field_name + '^' + boost_value;
                fields.push(f);
            });
        
        if(fields.length > 0)
            return  '&qf=' +  fields.join('+');
        
    return ''
}

function build_query(){
    console.log('build query')
    
    
    var query = $("#search_text").val()
    var fl = "&fl="+ doc_id

    $.each(doc_fields, function(index,val){fl += ', '+ val })
    
    var json ='&wt=json&json.wrf=?'
    
    return  "http://" + solr + url + fl + get_query_fields() + "&q=" +  query + json;
}

function display_header(){
    var header = document.createElement('thead');
    var row =  document.createElement('tr');
    header.appendChild(row);

    var th = document.createElement('th');
    th.appendChild(document.createTextNode(doc_id));
    row.appendChild(th)

    for(i =0; i< doc_fields.length; i++){
        var th = document.createElement('th');
        th.appendChild(document.createTextNode(doc_fields[i]));
    	row.appendChild(th);        
    }    
    document.getElementById("result_list").appendChild(header);
}
function display_document(doc){

    var row = document.createElement('tr');
    row.setAttribute('id',"result_" + doc[doc_id] );

    var td = document.createElement('td');
    td.appendChild(document.createTextNode(doc[doc_id]));
	row.appendChild(td);        

    for(i =0; i< doc_fields.length; i++){
        var td = document.createElement('td');
        td.appendChild(document.createTextNode(doc[doc_fields[i]]));
    	row.appendChild(td);        
    }

document.getElementById("result_list").appendChild(row);
}