import bpy,math,json,struct
from pathlib import Path
ROOT=Path.cwd(); BASE=ROOT/'design-pack/12-campaign-map'; OUT=BASE/'models';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
def mat(name,color,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough;return m
stone=mat('Obsidian campaign table',(.022,.032,.035),.35,.3);gold=mat('Worn brass edges',(.42,.27,.095),.8,.32)
sea=mat('Deep ocean',(.006,.028,.045),.25,.28)
def cube(name,loc,scale,material,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
 if bevel:m=o.modifiers.new('Crafted edge','BEVEL');m.width=bevel;m.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
cube('Map table / independent physical asset',(0,0,-.40),(20.8,10.8,.5),stone,.15)
for x in [-10.3,10.3]:cube('Brass side border',(x,0,-.1),(.07,10.6,.08),gold,.02)
for y in [-5.3,5.3]:cube('Brass top border',(0,y,-.1),(20.6,.07,.08),gold,.02)
buf=(BASE/'source-world/terrain/surface.bin').read_bytes();assert buf[:4]==b'EATL';w,h=struct.unpack_from('<II',buf,4);assert len(buf)==12+w*h*3
def sample(u,v):
 ix=round(u*(w-1));iy=round(v*(h-1));off=12+(iy*w+ix)*3;cov=buf[off];z=struct.unpack_from('<H',buf,off+1)[0]/65535*1.6-.08;return z*1.45,cov
nx,ny=513,257;verts=[];faces=[]
for j in range(ny):
 for i in range(nx):
  u,v=i/(nx-1),j/(ny-1);z,cov=sample(u,v);verts.append(((u-.5)*20,(.5-v)*10,z))
for j in range(ny-1):
 for i in range(nx-1):
  a=j*nx+i;faces.append((a,a+nx,a+nx+1,a+1))
mesh=bpy.data.meshes.new('Atlas native heightfield');mesh.from_pydata(verts,[],faces);mesh.update();terrain=bpy.data.objects.new('TEOLAM / original 1025x513 relief sampled 513x257',mesh);scene.collection.objects.link(terrain)
uv=mesh.uv_layers.new(name='Original world normalized UV')
for poly in mesh.polygons:
 poly.use_smooth=True
 for li in poly.loop_indices:
  vi=mesh.loops[li].vertex_index;i=vi%nx;j=vi//nx;uv.data[li].uv=(i/(nx-1),1-j/(ny-1))
terrainmat=mat('Original atlas world texture / preserved geography',(1,1,1),.03,.78)
nt=terrainmat.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(BASE/'source-world/terrain/world.webp'));tex.image.pack();nt.links.new(tex.outputs['Color'],nt.nodes.get('Principled BSDF').inputs['Base Color']);terrain.data.materials.append(terrainmat)
atlas=json.loads((BASE/'data/atlas-original.json').read_text(encoding='utf-8'));regionids=['teomli','shi-qra','serath','aldemir','val-teresh','ebedi-buzullar']
for rid in regionids:
 p=next(x for x in atlas['points'] if x['id']==rid);x,y=(p['x']-.5)*20,(.5-p['y'])*10;z,_=sample(p['x'],p['y'])
 bpy.ops.mesh.primitive_torus_add(major_radius=.14,minor_radius=.027,major_segments=24,minor_segments=8,location=(x,y,z+.1));o=bpy.context.object;o.name='Region anchor / '+rid;o.data.materials.append(gold)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.085,location=(x,y,z+.21));o=bpy.context.object;o.name='Animated region crystal / '+rid
 gl=mat('Crystal '+rid,(.7,.39,.11),.2,.28);b=gl.node_tree.nodes.get('Principled BSDF');b.inputs['Emission Color'].default_value=(.7,.26,.025,1);b.inputs['Emission Strength'].default_value=1.3;o.data.materials.append(gl)
 for frame,scale in [(1,1),(30,1.18),(60,1)]:o.scale=(scale,scale,scale);o.keyframe_insert('scale',frame=frame)
scene.frame_start=1;scene.frame_end=60;scene.render.fps=24;scene.frame_set(1)
world=bpy.data.worlds.new('Cold atlas chamber') if not bpy.data.worlds else bpy.data.worlds[0];scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.04,.06,.09,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4
def area(loc,power,color,size):
 d=bpy.data.lights.new('Map studio area','AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size;o=bpy.data.objects.new('Map studio area',d);scene.collection.objects.link(o);o.location=loc
area((0,0,15),1900,(.79,.88,1),14);area((-8,-5,7),900,(1,.65,.3),8)
from mathutils import Vector
def camera(name,loc,target,ortho):
 d=bpy.data.cameras.new(name);d.type='ORTHO';d.ortho_scale=ortho;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();return o
scene.camera=camera('Campaign overview',(0,-13,18),(0,0,.2),24)
camera('Top-down exact atlas coordinates',(0,0,20),(0,0,0),22)
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'teolam-campaign-map-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'eruldin-campaign-map-v3.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'eruldin-campaign-map-v3.glb'),export_format='GLB',export_animations=True,export_lights=False,export_cameras=True)
bpy.ops.render.render(write_still=True)
(OUT/'MODEL-NOTES.txt').write_text('Gerçek yükseklik geometrisi; kaynak EATL 1025x513 yükseklik alanından 513x257 örnekleme. 131841 tepe, 131072 dörtgen yüz. Coğrafi UV özgün world.webp. Altı bölge işareti gerçek m2026 POI koordinatında. Zağra Khur col uzayında olduğundan bu modele rastgele yerleştirilmedi. GLB doku gömülü; Blender dosyası düzenlenebilir. Masa ve pirinç kenarlar gerçek mesh. Altı kristal ölçek animasyonu 2.5 saniye. Yakın plan final PBR/LOD denetimi yapılmadı; bu model harita sanat varlığıdır, uygulamaya bağlanmadı.',encoding='utf-8')
print('MAP MODEL SAVED')
