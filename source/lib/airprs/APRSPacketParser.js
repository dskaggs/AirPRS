function APRSPacketParser( )
{
			
	//Main public parsing function
	this.parse = function( packet )
	{
		var report = new APRSPositionReport();
		
		//Store the raw packet in the position report object
		report.rawPacket = packet;
		
		//Extract the callsign from the packet
		this.extractCall( report );
		
		//Extract the message section of the packet
		this.extractMessage( report );
		
		//Determine what kind of message is included
		this.extractMessageType( report );
		
		//Extract the position data
		this.extractPosition( report );
		
		//Extract the timestamp data
		this.extractTimeStamp( report );
		
		//Extract the altitude
		this.extractAltitude( report );
		
		return report;
	};
	
	//Retrieve the station's callsign from the raw packet
	this.extractCall = function ( report )
	{
		report.call = report.rawPacket.split(">")[0];
	};
	
	//Retrieve the message type identifier from the raw packet	
	this.extractMessageType = function ( report )
	{
		/*
		  The message type identifier is the next character after that colon
		  The codes that are supported at the moment are below:
		  ! - Position without timestamp , or Ultimeter 2000 WX Station
		  = - Position without timestamp with APRS messaging
		  @ - Position with timestamp with APRS messagin
		  		  
		 */
		report.messageTypeIdentifier = report.message.charAt(0);
	};
	
	//Retrieve the message section from the raw packet
	this.extractMessage = function( report )
	{
		//The APRS message seems to start after the first ":" character in the raw packet
		try {
			report.message = report.rawPacket.split(":")[1];
		} catch (e) {
			
		}
		
		
	}
	
	//Create a timestamp from the time in the raw packet if one exists
	this.extractTimeStamp = function( report )
	{
		var ts = new Date();
		
		try {
	
		var message = report.message;
		
			if (report.messageTypeIdentifier == '@') {
				/*
				 * There are 3 different time formats that can be used
				 * We are only dealing with Day/Hour/Minutes in either
				 * zulu or local time (not with month/day/hour/minute)
				 
				 */
				//Day/Hours/Minutes
				if (message.charAt(7) == 'z') {
					ts.setUTCDate(parseInt(message.substr(1, 2)));
					ts.setUTCHours(parseInt(message.substr(3, 2)));
					ts.setUTCMinutes(parseInt(message.substr(5, 2)));
					ts.setUTCMilliseconds(0);
				}
				else if (message.charAt(6) == 'l') {
					ts.setDate(parseInt(message.substr(1, 2)));
					ts.setHours(parseInt(message.substr(3, 2)));
					ts.setMinutes(parseInt(message.substr(5, 2)));
					ts.setMilliseconds(0);
				}
			}			
		} catch (e) {
			
		}
		report.timeStamp = ts;
		
	}
	
	//Extract the latitude/longitude from the raw packet
	this.extractPosition = function( report )
	{
		try {
		
			var txtLat = report.message.split("/")[0];
			var txtLon = report.message.split("/")[1];
			var par = txtLat.charAt(txtLat.length-1);
			var mer = txtLon.charAt(8);		
			
			txtLat = txtLat.slice( txtLat.length - 8, txtLat.length);
			txtLon = txtLon.slice( 0, 9 );
			
			var latDegrees = parseFloat( txtLat.substr(0,2) );
			var latMinutes = parseFloat( txtLat.substr(2,5) );
			
			var lonDegrees = parseFloat( txtLon.substr(0,3) );
			var lonMinutes = parseFloat( txtLon.substr(3,5) );
			
			
			report.latitude = latDegrees + (latMinutes / 60);
			report.parallel = par;
			if( par == "S" ){
				report.latitude = report.latitude * -1;
			};
			report.longitude = lonDegrees + (lonMinutes / 60);
			report.meridian = mer;
			if( mer == "W")
			{
				report.longitude = report.longitude * -1;
			};
		
		} catch (e) {
			report.latitude = 0;
			report.longitude = 0;	
		}
		
	}
	
	//Extract the altitude from the raw packet if one exists
	this.extractAltitude = function( report )
	{
		try {
	
			var startAlt = report.message.indexOf("/A=");
			if( startAlt > 0 )
			{
				var txtAlt = report.message.substr( startAlt+3, 6 );
				report.altitude = parseInt( txtAlt, 10 );
				
			}
			
		} catch (e) {
			
		}
		
	}
	
	//Parsing messages setup and retrieval
	
	this.getMessage = function(msgName){
			
		return this.Messages[ msgName ];
	
	}
	
	this.InitializeMessages = function(){
		
		var Messages = new Object();
		
		Messages.unknown = 'Unsupported packet format';
		
		Messages.packet_no = 'No packet given to parse';
		Messages.packet_short = 'Too short packet';
		Messages.packet_nobody = 'No body in packet';
		
		Messages.srccall_noax25 = 'Source callsign is not a valid AX.25 call';
		Messages.srccall_badchars = 'Source callsign contains bad characters';
		
		Messages.dstpath_toomany = 'Too many destination path components to be AX.25';
		Messages.dstcall_none = 'No destination field in packet';
		Messages.dstcall_noax25 = 'Destination callsign is not a valid AX.25 call';
		
		Messages.digicall_noax25 = 'Digipeater callsign is not a valid AX.25 call';
		Messages.digicall_badchars = 'Digipeater callsign contains bad characters';
		
		Messages.timestamp_inv_loc = 'Invalid timestamp in location';
		Messages.timestamp_inv_obj = 'Invalid timestamp in object';
		Messages.timestamp_inv_sta = 'Invalid timestamp in status';
		Messages.timestamp_inv_gpgga = 'Invalid timestamp in GPGGA sentence';
		Messages.timestamp_inv_gpgll = 'Invalid timestamp in GPGLL sentence';
		
		Messages.packet_invalid = 'Invalid packet';
		
		Messages.nmea_inv_cval = 'Invalid coordinate value in NMEA sentence';
		Messages.nmea_large_ew = 'Too large value in NMEA sentence (east/west)';
		Messages.nmea_large_ns = 'Too large value in NMEA sentence (north/south)';
		Messages.nmea_inv_sign = 'Invalid lat/long sign in NMEA sentence';
		Messages.nmea_inv_cksum = 'Invalid checksum in NMEA sentence';
		
		Messages.gprmc_fewfields = 'Less than ten fields in GPRMC sentence ';
		Messages.gprmc_nofix = 'No GPS fix in GPRMC sentence';
		Messages.gprmc_inv_time = 'Invalid timestamp in GPRMC sentence';
		Messages.gprmc_inv_date = 'Invalid date in GPRMC sentence';
		Messages.gprmc_date_out = 'GPRMC date does not fit in an Unix timestamp';
		
		Messages.gpgga_fewfields = 'Less than 11 fields in GPGGA sentence';
		Messages.gpgga_nofix = 'No GPS fix in GPGGA sentence';
		
		Messages.gpgll_fewfields = 'Less than 5 fields in GPGLL sentence';
		Messages.gpgll_nofix = 'No GPS fix in GPGLL sentence';
		
		Messages.nmea_unsupp = 'Unsupported NMEA sentence type';
		
		Messages.obj_short = 'Too short object';
		Messages.obj_inv = 'Invalid object';
		Messages.obj_dec_err = 'Error in object location decoding';
		
		Messages.item_short = 'Too short item';
		Messages.item_inv = 'Invalid item';
		Messages.item_dec_err = 'Error in item location decoding';
		
		Messages.loc_short = 'Too short uncompressed location';
		Messages.loc_inv = 'Invalid uncompressed location';
		Messages.loc_large = 'Degree value too large';
		Messages.loc_amb_inv = 'Invalid position ambiguity';
		
		Messages.mice_short = 'Too short mic-e packet';
		Messages.mice_inv = 'Invalid characters in mic-e packet';
		Messages.mice_inv_info = 'Invalid characters in mic-e information field';
		Messages.mice_amb_large = 'Too much position ambiguity in mic-e packet';
		Messages.mice_amb_inv = 'Invalid position ambiguity in mic-e packet';
		Messages.mice_amb_odd = 'Odd position ambiguity in mic-e packet';
		
		Messages.comp_inv = 'Invalid compressed packet';
		
		Messages.msg_inv = 'Invalid message packet';
		
		Messages.wx_unsupp = 'Unsupported weather format';
		Messages.user_unsupp = 'Unsupported user format';
		
		Messages.dx_inv_src = 'Invalid DX spot source callsign';
		Messages.dx_inf_freq = 'Invalid DX spot frequency';
		Messages.dx_no_dx = 'No DX spot callsign found';
		
		Messages.tlm_inv = 'Invalid telemetry packet';
		Messages.tlm_large = 'Too large telemetry value';
		Messages.tlm_unsupp = 'Unsupported telemetry';
		
		Messages.exp_unsupp = 'Unsupported experimental';
		
		Messages.sym_inv_table = 'Invalid symbol table or overlay';
		
		this.Messages = Messages;
	}	

	this.InitializeMessages();
	
	return this;
}

