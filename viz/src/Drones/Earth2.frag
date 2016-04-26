//http://www.rigb.org/docs/debris/
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D spectexture;
uniform sampler2D cloudtexture;
uniform vec3 sunDirection;
uniform vec3 viewDirection;

varying vec2 vUv;
varying vec3 vNormal;

void main()
{

	vec3 view = normalize(viewDirection);

	// Values from textures using the texture coordinate from the vertex shader
	vec3 colorDay = texture2D(texture1, vUv).rgb;
	vec3 colorNight = texture2D(texture2, vUv).rgb;
	vec3 colorSpec = texture2D(spectexture, vUv).rgb;
	// Rather than a RGB colour for the clouds we just want a numerical value
	// In this case we use the red channel although this is obviosuly not ideal
	float cloudamount = texture2D(cloudtexture, vUv).r;

	//Calculate the diffuse component of the reflected light from the sun
	float sphere_diffuse = max(dot(normalize(vNormal), sunDirection), 0.0);

	// Calculate the amount of atmospheric reflection absed on viewer position
	float atmos_amount = max(dot(normalize(vNormal), sunDirection), 0.0);
	vec3 R  = 2.0 * ( dot(normalize(vNormal),sunDirection)) * normalize(vNormal) - sunDirection;
	vec3 E = view;

	//Calculate amount of specular light reflected
	//vec3 specular_value =  colorSpec * pow( max(dot(R,E), 0.0), 6.0 ); Not Working
	vec3 specular_value =  colorSpec * 0.0;

	vec3 lights;

	if (colorNight.r < 0.6) {
	// lights = vec3(colorNight.r/3.0,colorNight.g/3.0,colorNight.b/1.5);
	lights = vec3(colorNight.r*1.0,colorNight.g*1.0,colorNight.b*1.0);
	} else {
	lights = vec3(colorNight.r*1.0,colorNight.g*0.8,colorNight.b*0.4);
	}

	colorNight=lights;

	// compute cosine sun to normal so -1 is away from sun and +1 is toward sun.
	float cosineAngleSunToNormal = dot(normalize(vNormal), sunDirection);

	// sharpen the edge beween the transition
	//cosineAngleSunToNormal = clamp( cosineAngleSunToNormal * 30.0, -1.0, 1.0);
	sphere_diffuse = clamp( sphere_diffuse * 10.0, -1.0, 1.0);

	// convert to 0 to 1 for mixing
	float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;

	// Select day or night texture based on mix.
	vec3 blue = vec3(0.2,0.4,0.8);
	vec3 color = mix( colorNight+vec3(0.1,0.1,0.2)*cloudamount, colorDay+(specular_value/1.3)+vec3(1.0,1.0,1.0)*cloudamount+blue*(1.0-atmos_amount), sphere_diffuse);

	gl_FragColor = vec4( color , 1.0 );

}
