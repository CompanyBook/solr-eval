var url = '/select/?start=0&rows=10&wt=json&json.wrf=?&debugQuery=true';
var luke = '/admin/luke?show=schema&wt=json&json.wrf=?&indent=true';
var search_result = '';
var doc_fields = ['name', 'score', 'boost_revenue', 'city'];
var doc_id = 'company_id';
var solr = "datanode29.companybook.no:8080/solr/no_companies_20120207";

$(document).ready(function() {
    
    load_solr_schema();
    
    $('#search > form').submit(function(e) {
        e.preventDefault();
        console.log('clicked');

        var query = $("#search_text").val()
        if (query.length == 0) {
            alert('search for something...')
            return false
        }
        $("#result_list").children().remove();
        console.log('before search call')
        $.ajax(
        {
            url: build_query(),
            dataType: 'json',
            data: {},
            success: function(result) {
                console.log('search done')
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
    });
});


var solr_schema = null;

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




function build_query(){
        var query = $("#search_text").val()
        var fl = "&fl="+ doc_id
        $.each(doc_fields, function(index,val){fl += ', '+ val })

        return  "http://" + solr + url +fl + "&q=" +  query
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