#version 130

out vec4 gl_FragColor;

const vec2 iResolution = vec2(1920, 1080);

const vec3 c = vec3(1.,0.,-1.);
const float pi = acos(-1.);

const float fsaa = 16;

const int npts = 168;
const float path[npts] = float[npts](-0.500,0.145,-0.500,-0.145,-0.500,-0.145,-0.395,-0.145,-0.395,-0.145,-0.395,-0.042,-0.395,-0.042,-0.362,-0.042,-0.362,-0.042,-0.362,-0.145,-0.362,-0.145,-0.163,-0.145,-0.163,-0.145,-0.163,0.145,-0.163,0.145,-0.246,0.145,-0.246,0.145,-0.246,0.048,-0.246,0.048,-0.279,0.048,-0.279,0.048,-0.279,0.145,-0.279,0.145,-0.500,0.145,-0.131,0.145,-0.131,-0.145,-0.131,-0.145,-0.048,-0.145,-0.048,-0.145,-0.048,-0.042,-0.048,-0.042,-0.015,-0.042,-0.015,-0.042,-0.015,-0.145,-0.015,-0.145,0.300,-0.145,0.300,-0.145,0.300,-0.052,0.300,-0.052,0.184,-0.052,0.184,-0.052,0.184,-0.007,0.184,-0.007,0.034,0.024,0.034,0.024,0.184,0.055,0.184,0.055,0.184,0.145,0.184,0.145,-0.131,0.145,0.217,0.145,0.217,0.041,0.217,0.041,0.136,0.024,0.136,0.024,0.217,0.008,0.217,0.008,0.217,-0.032,0.217,-0.032,0.333,-0.032,0.333,-0.032,0.333,-0.145,0.333,-0.145,0.500,-0.145,0.500,-0.145,0.500,0.145,0.500,0.145,0.333,0.145,0.333,0.145,0.333,0.048,0.333,0.048,0.300,0.048,0.300,0.048,0.300,0.145,0.300,0.145,0.217,0.145,-0.048,0.083,-0.015,0.083,-0.015,0.083,-0.015,0.048,-0.015,0.048,-0.048,0.048,-0.048,0.048,-0.048,0.083);

const int npts2 = 144;
const float path2[npts2] = float[npts2](-0.500,0.145,-0.500,-0.145,-0.500,-0.145,-0.182,-0.145,-0.182,-0.145,-0.182,0.145,-0.182,0.145,-0.320,0.145,-0.320,0.145,-0.320,-0.025,-0.320,-0.025,-0.285,-0.025,-0.285,-0.025,-0.285,-0.042,-0.285,-0.042,-0.381,-0.042,-0.381,-0.042,-0.381,-0.025,-0.381,-0.025,-0.345,-0.025,-0.345,-0.025,-0.345,0.145,-0.345,0.145,-0.500,0.145,-0.158,0.145,-0.158,-0.145,-0.158,-0.145,-0.070,-0.145,-0.070,-0.145,-0.070,0.044,-0.070,0.044,-0.046,0.044,-0.046,0.044,-0.046,-0.145,-0.046,-0.145,0.154,-0.145,0.154,-0.145,0.154,0.145,0.154,0.145,0.065,0.145,0.065,0.145,0.065,-0.034,0.065,-0.034,0.041,-0.034,0.041,-0.034,0.041,0.145,0.041,0.145,-0.158,0.145,0.179,0.145,0.179,-0.145,0.179,-0.145,0.500,-0.145,0.500,-0.145,0.500,0.003,0.500,0.003,0.328,0.003,0.328,0.003,0.328,-0.034,0.328,-0.034,0.304,-0.034,0.304,-0.034,0.304,0.044,0.304,0.044,0.328,0.044,0.328,0.044,0.328,0.019,0.328,0.019,0.500,0.019,0.500,0.019,0.500,0.145,0.500,0.145,0.179,0.145);

void rand(in vec2 x, out float n)
{
    x += 400.;
    n = fract(sin(dot(sign(x)*abs(x) ,vec2(12.9898,78.233)))*43758.5453);
}

void lfnoise(in vec2 t, out float n)
{
    vec2 i = floor(t);
    t = fract(t);
    t = smoothstep(c.yy, c.xx, t);
    vec2 v1, v2;
    rand(i, v1.x);
    rand(i+c.xy, v1.y);
    rand(i+c.yx, v2.x);
    rand(i+c.xx, v2.y);
    v1 = c.zz+2.*mix(v1, v2, t.y);
    n = mix(v1.x, v1.y, t.x);
}

void lcfnoise(in vec2 t, out float n)
{
    lfnoise(t,n);
    n = 1.-2.*abs(.5-abs(n));
}

#define mf(mfid, lfid) void mfid(in vec2 x, in float d, in float b, in float e, out float n){n = 0.;float a = 1., nf = 0., buf;for(float f = d; f<b; f *= 2.){lfid(f*x+.1*a, buf);n += a*buf;a *= e;nf += 1.;}n *= (1.-e)/(1.-pow(e, nf));}#CRLF
mf(mfnoise, lfnoise)
mf(mcfnoise, lcfnoise)

void dbox3(in vec3 x, in vec3 b, out float d)
{
  vec3 da = abs(x) - b;
  d = length(max(da,0.0))
         + min(max(da.x,max(da.y,da.z)),0.0);
}

void dbox(in vec2 x, in vec2 b, out float d)
{
	vec2 da = abs(x)-b;
	d = length(max(da,c.yy)) + min(max(da.x,da.y),0.0);
}

// Distance to regular voronoi
void dvoronoi(in vec2 x, out float d, out vec2 ind)
{
    vec2 y = floor(x);
   	float ret = 1.;
    
    //find closest control point. ("In which cell am I?")
    vec2 pf=c.yy, p;
    float df=10.;
    
    for(int i=-1; i<=1; i+=1)
        for(int j=-1; j<=1; j+=1)
        {
            p = y + vec2(float(i), float(j));
            float pa;
            rand(p, pa);
            p += pa;
            
            d = length(x-p);
            
            if(d < df)
            {
                df = d;
                pf = p;
            }
        }
    
    //compute voronoi distance: minimum distance to any edge
    for(int i=-1; i<=1; i+=1)
        for(int j=-1; j<=1; j+=1)
        {
            p = y + vec2(float(i), float(j));
            float pa;
            rand(p, pa);
            p += pa;
            
            vec2 o = p - pf;
            d = length(.5*o-dot(x-pf, o)/dot(o,o)*o);
            ret = min(ret, d);
        }
    
    d = ret;
    ind = pf;
}

void dlinesegment(in vec2 x, in vec2 p1, in vec2 p2, out float d)
{
    vec2 da = p2-p1;
    d = length(x-mix(p1, p2, clamp(dot(x-p1, da)/dot(da,da),0.,1.)));
}

void dnr4(in vec2 x, out float ret)
{
    ret = 1.;
    float da;

    float n = 0.;
    for(int i=0; i<npts/4; ++i)
    {
        vec2 ptsi = vec2(path[4*i], path[4*i+1]),
            ptsip1 = vec2(path[4*i+2], path[4*i+3]),
            k = x-ptsi, 
            d = ptsip1-ptsi;
        
        float beta = k.x/d.x,
            alpha = d.y*k.x/d.x-k.y;
        
        n += step(.0, beta)*step(beta, 1.)*step(0., alpha);
        dlinesegment(x, ptsi, ptsip1, da);
        ret = min(ret, da);
    }
    
    ret = mix(ret, -ret, mod(n, 2.));
}

void dunc(in vec2 x, out float ret)
{
    ret = 1.;
    float da;

    float n = 0.;
    for(int i=0; i<npts2/4; ++i)
    {
        vec2 ptsi = vec2(path2[4*i], path2[4*i+1]),
            ptsip1 = vec2(path2[4*i+2], path2[4*i+3]),
            k = x-ptsi, 
            d = ptsip1-ptsi;
        
        float beta = k.x/d.x,
            alpha = d.y*k.x/d.x-k.y;
        
        n += step(.0, beta)*step(beta, 1.)*step(0., alpha);
        dlinesegment(x, ptsi, ptsip1, da);
        ret = min(ret, da);
    }
    
    ret = mix(ret, -ret, mod(n, 2.));
}

void stroke(in float d0, in float s, out float d)
{
    d = abs(d0)-s;
}

void zextrude(in float z, in float d2d, in float h, out float d)
{
    vec2 w = vec2(d2d, abs(z)-0.5*h);
    d = min(max(w.x,w.y),0.0) + length(max(w,0.0));
}

void add(in vec2 sda, in vec2 sdb, out vec2 sdf)
{
    sdf = (sda.x<sdb.x)?sda:sdb;
}

void main_scene(in vec3 x, out vec2 sdf)
{
    x.x -= sin(.2*x.z-.1);
    float y0 = x.y;
    x.y += .2+.08*x.z;

    // Main tunnel
    sdf = c.zy;
    float d, da;
    dbox3(x, vec3(1.,.9,100.), d);
    sdf.x = max(sdf.x, -d);
    
    // Steel construction
    // Sides
    vec3 y = vec3(mod(x.z,2.)-1., x.y, abs(x.x)-.89);
    dbox3(y, vec3(.01,2.2,.1), d);
    dbox3(vec3(y.xy, abs(y.z)-.1), vec3(.1,2.2,.01), da);
    d = min(d,da);
    // Top
    dbox3(vec3(x.x,x.y-.86, abs(mod(x.z,2.)-1.)-.07), vec3(.78,.05, .01), da);
    d = min(d,da);
    add(sdf, vec2(d, 1.), sdf);
    
    // Rails
    y = vec3(abs(x.x)-.25, x.y+.9, x.z);
    dbox3(y, vec3(.02,.1,100.), d);
    add(sdf, vec2(d, 1.), sdf);
    
    // Rail beds
    dbox3(vec3(y.xy, mod(x.z, .66)-.5*.66), vec3(.25,.04, .08), d);
    add(sdf, vec2(d, 3.), sdf);

    // Spheres
//     const float w = 2.;
//     float v;
//     vec2 vi;
//     dvoronoi((x.xy)*w,v, vi); 
//     add(sdf, vec2(abs(length(x-vec3(vi,0.)/w+4.*c.yyx)-.4)-.001, 2.), sdf);

    // Water floor
    // Gerst it
    d = 0.;
    mfnoise(x.xz, 8.,800., .15, d);
    add(sdf, vec2(y0+.85-.005*d, 2.), sdf);
    
    // Cable
    d = length(vec2(abs(x.x)-.18, x.y)-c.yx*.8+.1*abs(sin(.5*pi*x.z-.5*pi))*c.yx)-.006;
    add(sdf, vec2(d, 4.), sdf);
    
    // Cable holder
    d = length(vec2(abs(x.x)-.18, x.y)-c.yx*.8)-.01;
    d = abs(d)-.01;
    zextrude(mod(x.z,2.)-1., d, .005, d);
    add(sdf, vec2(d, 3.), sdf);
    
//     // Light holder
//     dbox3(x+2.*c.yyx-.9*c.yxy, vec3(.025,.05,.5), d);
//     add(sdf, vec2(d, 3.), sdf);
//     
//     // Light
//     d = length(x.xy-.8375*c.yx)-.0125;
//     zextrude(x.z+2., d, 1., d);
//     add(sdf, vec2(d, 5.), sdf);

//     add(sdf, vec2(length(x+2.*c.yyx)-.1), sdf);
}

void tiles_scene(in vec3 x, out vec2 sdf)
{
    x = x.zyx*vec3(1.,1.,-sign(x.x));
    float n;
    mfnoise(x.xy, 4.,4.e2, .55, n);

    float d, w = .4;
    vec2 y = mod(x.xy, w)-.5*w;
    dbox(y, .45*w*c.xx, d);
    
    // cracks
    float v;
    vec2 vi;
    dvoronoi((x.xy-.1*n)/w,v, vi); 
    
    v = mix(v, 1., smoothstep(1.5/iResolution.y, -1.5/iResolution.y, .3+n));
    
    sdf.x = x.z
        +.005*(.5+.5*n)
        - .05*smoothstep(1.5/iResolution.y, -1.5/iResolution.y, abs(v)-.01)
        +.3*smoothstep(2.5/iResolution.y, -2.5/iResolution.y, d+.005*n)*smoothstep(-1.5/iResolution.y,1.5/iResolution.y,.3+n)
        -.05*(.5*n+.5)*smoothstep(1.5/iResolution.y,-1.5/iResolution.y,.05+n)
        ;
    sdf.y = 1.;
}

void rust_scene(in vec3 x, out vec2 sdf)
{
    float n, nlo, na;
    mfnoise(x.xy,4.8e1, 4.8e3, .65, na);
    mfnoise(x.xy,1.8e1, 4.8e3, .55, n);
    lfnoise(6.*x.xy, nlo);
    
    sdf.x = x.z+.004*n-.004*smoothstep(na-.1,na+.1,nlo);
    sdf.y = 1.;
}

#define normal(o, t)void o(in vec3 x, out vec3 n, in float dx){vec2 s, na;t(x,s);t(x+dx*c.xyy, na);n.x = na.x;t(x+dx*c.yxy, na);n.y = na.x;t(x+dx*c.yyx, na);n.z = na.x;n = normalize(n-s.x);}#CRLF  
normal(main_normal, main_scene)
normal(tiles_normal, tiles_scene)
normal(rust_normal, rust_scene)

void tiles_texture(in vec2 x, out vec3 col)
{
    float w = .4,
        d;
    vec2 y = mod(x, w)-.5*w;
    float n;
    mfnoise(x, 4.,4.e2, .38, n);
    
    dbox(y, .47*w*c.xx, d);
    d += .005*n;
    col = mix(vec3(0.90,0.84,0.80),1.2*vec3(1.00,0.95,0.86), .5+.5*n);
    
    // Dirt/rust
    float nr;
    mfnoise(x*vec2(12.,1.), 1.,1.e2, .85, nr);
    col = mix(col, 1.4*vec3(0.80,0.58,0.22), clamp(.1+.9*nr,0.,1.));
    
    // cracks
    float v;
    vec2 vi;
    dvoronoi((x.xy-.1*n)/w,v, vi); 
    col = mix(col, c.yyy, smoothstep(1.5/iResolution.y, -1.5/iResolution.y, abs(v)-.01));
   
    // joint
    col = mix(vec3(0.22,0.22,0.22), col, smoothstep(1.5/iResolution.y, -1.5/iResolution.y, d));
    
    // holes
    col = mix(col, .8*vec3(0.54,0.48,0.45), smoothstep(1.5/iResolution.y, -1.5/iResolution.y, .15+n));
}

void rust_texture(in vec2 x, out vec3 col)
{
    float n, nlo;
    
    mfnoise(x,4.8e1, 4.8e3, .65, n);
    lfnoise(6.*x, nlo);
    col = mix(vec3(0.37,0.07,0.00), vec3(0.62,0.63,0.66), .5+.5*n);
    
    vec3 c1 = mix(vec3(1.00,0.84,0.70), vec3(0.37,0.07,0.00), .5+.5*n);
    col = mix(col, c1, smoothstep(n-.1,n+.1,nlo));
    col = mix(col, vec3(0.64,0.39,0.32), (.5+.5*n)*smoothstep(n-.1,n+.1,nlo));
    
    float nb;
    stroke(n, .1, nb);
    col = mix(col, vec3(0.58,0.33,0.26), smoothstep(1.5/iResolution.y, -1.5/iResolution.y, nb));
}

float sm(in float d)
{
    return smoothstep(1.5/iResolution.y, -1.5/iResolution.y, d);
}

void graffiti_texture(in vec2 uv, inout vec3 col)
{
    float na, d;
    mcfnoise(uv, 6., 12000., .1, na);
    float dc = length(vec2(.5,1.)*uv)-.3;
    
    dnr4(uv*vec2(1.,.75)-.05*na, d);
    d = mix(d, dc, .05);
    dc = mix(dc, d, .5);
    d /= 2.;
    
    col = mix(col*col/2., vec3(0.93,0.11,0.14), sm(dc-.15*na)); // red flames
    col = mix(col, c.yyy, sm(dc-.25*na + .2)); // black flames
    col = mix(col, vec3(1.00,0.95,0.46), sm(abs(dc-.25*na+.2)-.008)); // orange flame yellow border
    dc = abs(dc-.15*na)-.025; 
    col = mix(col, vec3(1.00,0.95,0.46), sm(dc)); // yellow outside
    col = mix(col, c.yyy, sm(abs(dc)-.008)); // yellow outside blak border

    
//     d += .02*na;
    col = mix(col,.01*c.xxx, sm(d)); // nr4 body, blak
    col = mix(col, vec3(1.00,0.95,0.46), sm(d+.015)); // nr4 body inside, yellow
    col = mix(col, vec3(0.93,0.11,0.14), sm(d+.03)); // nr4 body inside inside, red
    col = mix(col, c.yyy, sm(abs(d+.03)-.003)); // nr4 body inside inside, blakk
    
    float da = abs(d)-.005;
    col = mix(col, vec3(0.36,0.75,0.92), sm(da)); // nr4 border, blu
    da = 5.*(abs(da)-.0016);
    col = mix(col, c.yyy, sm(da)); // nr4 border border, blak
    
//     vec2 vi;
//     dvoronoi(4.*uv, d, vi);
//     col = mix(col, c.xxx, sm(length(uv-vi/4.)-.02));
    
    col = 2.*sqrt(col);
}

void unc_texture(in vec2 uv, inout vec3 col)
{
    float na,d;
    
    mfnoise(uv, 1., 1000., .05, na);
    
    dunc(vec2(1.,.5)*uv+.05*na, d);
    d -= .005;
    col = mix(col*col/4., c.xxx, sm(d));
    col = mix(col, c.yyy, sm(abs(d)-.01));
//     col = mix(col, 2.*vec3(0.87,0.21,0.62), sm(abs(abs(d)-.01)-.005));
    
    col = 2.*sqrt(col);
}

void analytical_box(in vec3 o, in vec3 dir, in vec3 size, out float d)
{
    vec3 tlo = min((size-o)/dir,(-size-o)/dir); // Select 3 visible planes
    vec2 abxlo = abs(o.yz + tlo.x*dir.yz),
        abylo = abs(o.xz + tlo.y*dir.xz),
        abzlo = abs(o.xy + tlo.z*dir.xy);
    vec4 dn = 100.*c.xyyy;
    
    dn = mix(dn, vec4(tlo.x,c.xyy), float(all(lessThan(abxlo,size.yz)))*step(tlo.x,dn.x));
    dn = mix(dn, vec4(tlo.y,c.yxy), float(all(lessThan(abylo,size.xz)))*step(tlo.y,dn.x));
    dn = mix(dn, vec4(tlo.z,c.yyx), float(all(lessThan(abzlo,size.xy)))*step(tlo.z,dn.x));

    d = dn.r;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord-.5*iResolution)/iResolution.y,
        s;
    vec3 col = c.xxx,
        o = c.yyx-.4*c.xyy,
        o0 = o,
        r = c.xyy,
        t = c.yyy, 
        u = cross(normalize(t-o),-r),
        dir,
        n, 
        x,
        c1 = c.yyy,
        l;
    int N = 450,
        i;
    float d = 0., d0;
    
    t += uv.x * r + uv.y * u;
    dir = normalize(t-o);
    vec3 dir0 = dir;
    
    for(i = 0; i<N; ++i)
    {
        x = o + d * dir;
        main_scene(x,s);
        if(s.x < 1.e-4) break;
        d += min(s.x,1.e-1);
    }
    
    d0 = d;
    vec3 c2;
    float re = 0.;
    
    if(i<N)
    {
        main_normal(x, n, 1.e-4);
        l = c.yyx;
        
        if(s.y == 2.) // Water
        {
            re = 1.;
            
            c2 = c.xxx;
            c2 = .1*c2 
                + .2*c2*dot(l, n)
                + 4.4*c2*pow(abs(dot(reflect(l,n),dir)),2.);

                o = x;
                dir = reflect(dir, n);
                d = 2.e-2;
                
                for(i = 0; i<N; ++i)
                {
                    x = o + d * dir;
                    main_scene(x,s);
                    if(s.x < 1.e-4) break;
                    d += s.x;
                }
                
                main_normal(x,n,1.e-4);
                
                c2 = .2*c.xyy+c.yyx;
                c2 = .1*c2 
                    + .2*c2*dot(l, n)
                    + 2.5*c2*pow(abs(dot(reflect(l,n),dir)),2.);
//             }
        }
        
        dir = dir0;
          
        if(s.y == 0.)
        {
            col = c.yyy;
            
            if(dot(n, c.xyy) != 0.)
            {
                o = x;
                d = 0.;
                
                for(i = 0; i<N; ++i)
                {
                    x = o + d * dir;
                    tiles_scene(4.*x,s);
                    if(s.x < 1.e-4) break;
                    d += s.x;
                }
                
                if(i < N)
                {
                    tiles_normal(4.*x,n,5.e-4);
                    tiles_texture(4.*x.zy, c1);
                    graffiti_texture(x.zy+2.2*c.xy*sign(x.x)+.45*c.yx, c1);
                    unc_texture((x.zy+.39*c.xy*sign(x.x))+.45*c.yx, c1);
//                     c1 = sqrt(c1);
                    c1 = .1*c1 
                        + .2*c1*dot(l, n)
                        + .8*c1*pow(abs(dot(reflect(l,n),dir)),6.);
                }
            }
            else
            {
                o = x;
                d = 0.;
                
                for(i = 0; i<N; ++i)
                {
                    x = o + d * dir;
                    rust_scene(.4*x.zyx*vec3(1.,1.,-sign(x.x)),s);
                    if(s.x < 1.e-4) break;
                    d += s.x;
                }
                
                if(i < N)
                {
                    rust_normal(x.xzy,n,5.e-4);
                    rust_texture(.4*x.xz, c1);
                    c1 = .1*c1 
                        + .2*c1*dot(l, n)
                        + 1.5*c1*pow(abs(dot(reflect(l,n),dir)),6.);
                }
                
                c1 = length(c1)/sqrt(3.)*vec3(0.47,0.47,0.48);
            }
            col = c1;
        }
        else if(s.y == 1.) // Steel structures
        {
            col = c.yyy;
            
            if(dot(n, c.xyy) != 0.)
            {
                o = x;
                d = 0.;
                
                for(i = 0; i<N; ++i)
                {
                    x = o + d * dir;
                    rust_scene(x,s);
                    if(s.x < 1.e-4) break;
                    d += s.x;
                }
                
                if(i < N)
                {
                    rust_normal(x,n,5.e-4);
                    rust_texture(x.zy, c1);
                    c1 = .1*c1 
                        + .2*c1*dot(l, n)
                        + 1.5*c1*pow(abs(dot(reflect(l,n),dir)),6.);
                }
            }
            else if(dot(n,c.yyx) != 0.)
            {
                o = x;
                d = 0.;
                
                for(i = 0; i<N; ++i)
                {
                    x = o + d * dir;
                    rust_scene(x,s);
                    if(s.x < 1.e-4) break;
                    d += s.x;
                }
                
                if(i < N)
                {
                    rust_normal(x,n,5.e-4);
                    rust_texture(x.xy, c1);
                    c1 = .1*c1 
                        + .2*c1*dot(l, n)
                        + 1.5*c1*pow(abs(dot(reflect(l,n),dir)),6.);
                }
            }
            col = c1;
        }
        else if(s.y == 3.) // rail bed 
        {
            col = vec3(0.20,0.22,0.25);
            col = .1*col 
                + .2*col*dot(l, n)
                + 1.5*col*pow(abs(dot(reflect(l,n),dir)),6.);
        }
        else if(s.y == 4.) // cables
        {
            col = vec3(0.56,0.56,0.49);
//             col = c.xyy;
            col = .1*col 
                + .2*col*dot(l, n)
                + 1.5*col*pow(abs(dot(reflect(l,n),dir)),2.);
        }
//         else if(s.y == 5.) // Lamp
//         {
//             col = 4.*vec3(0.92,0.78,0.34);
//             col = .1*col 
//                 + .2*col*dot(l, n)
//                 + 1.5*col*pow(abs(dot(reflect(l,n),dir)),2.);
//         }
        if(re == 1.) // Plain reflection
        {
            col = mix(col, .2*c.yyx, .25);
        }
    }
    
    col = clamp(col, 0.,1.);
    
    col = mix(col, c.yyy, sm((-d0+6.)/10000.));
    
    col *= 1.25*col;
    col = mix(mix(col, sqrt(col)*vec3(0.92,0.78,0.34), .5), col, clamp(length(x-o0)/3.,0.,1.));
    
//     if(s.y == 5.) 
//     {
//         col = c.xxx;
//     }
    
    // Soft shadow
    o = x;
    dir = normalize(-2.*c.yyx-x);
    d = 1.e-2;
    
    for(i = 0; i<N; ++i)
    {
        x = o + d * dir;
        main_scene(x,s);
//         s.x -= .01; // Soften shadow
        if(s.x < 1.e-4) break;
        d += s.x;
    }
    
    if(d < length(-2.*c.yyx-o)) // We are in the dark
        col *= .4;
    
    // Ambient occlusion

//     col = mix(col, vec3(0.98,0.65,0.23), col);
    
    fragColor = vec4(clamp(col,0.,1.),1.);
}

void main()
{
    vec4 col = vec4(0.);
    float bound = sqrt(fsaa)-1.;
   	for(float i = -.5*bound; i<=.5*bound; i+=1.)
        for(float j=-.5*bound; j<=.5*bound; j+=1.)
        {
            vec4 c1;
            mainImage(c1, gl_FragCoord.xy+vec2(i,j)*1.5/max(bound, 1.));
     		col += c1;
        }
    col /= fsaa;
    gl_FragColor = col;
}
