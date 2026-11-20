import json, re, urllib.request, urllib.error, time
from pathlib import Path
"""手動雲端驗收：會建立匿名帳號及保留 rules-check-* 測試資料，不使用管理員權限。"""
config=(Path(__file__).resolve().parents[1]/'js/firebase-config.js').read_text()
key=re.search(r"apiKey: '([^']+)'",config)[1]
base=re.search(r"databaseURL: '([^']+)'",config)[1]
def request(url,method='GET',data=None):
    req=urllib.request.Request(url,data=None if data is None else json.dumps(data).encode(),headers={'Content-Type':'application/json'},method=method)
    try:
        with urllib.request.urlopen(req,timeout=20) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
status,auth=request('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+key,'POST',{'returnSecureToken':True})
assert status==200,(status,auth)
token,uid=auth['idToken'],auth['localId']
thread='rules-check-'+str(int(time.time()*1000))
root='feedback/chemistry_arpg/'
checks=[]
def test(name,path,data,expected,method='PUT',authenticated=True):
    status,result=request(base+'/'+path+'.json'+('?auth='+token if authenticated else ''),method,data)
    passed=status==expected
    checks.append({'name':name,'pass':passed,'status':status})
    print(json.dumps(checks[-1],ensure_ascii=False),flush=True)
    if status==200 and method=='PUT':print('retained_test_path='+path,flush=True)
    return passed
def payload(**kw):return dict({'author':'規則驗證','message':'[規則驗證] 正常多字內容\n第二行','uid':uid,'createdAt':{'.sv':'timestamp'}},**kw)
test('正常多字與換行主題',root+'threads/'+thread,payload(),200)
for field in ['author','message']:
    for i,value in enumerate(['', *map(chr, [9,10,11,12,13,32,160,5760,*range(8192,8203),8232,8233,8239,8287,12288,65279])]):
        test('拒絕空白 '+field+' '+str(i),root+'threads/'+thread+'-'+field+str(i),payload(**{field:value}),401)
test('拒絕偽造 uid',root+'threads/'+thread+'-uid',payload(uid='forged'),401)
test('拒絕額外欄位',root+'threads/'+thread+'-extra',payload(admin=True),401)
test('拒絕偽造時間',root+'threads/'+thread+'-time',payload(createdAt=1),401)
test('拒絕超長內容',root+'threads/'+thread+'-long',payload(message='x'*1001),401)
test('正常回覆',root+'replies/'+thread+'/reply',payload(),200)
test('拒絕空白回覆',root+'replies/'+thread+'/blank',payload(message=' \t\n'),401)
test('拒絕不存在主題回覆',root+'replies/'+thread+'-missing/reply',payload(),401)
test('拒絕修改',root+'threads/'+thread,payload(message='修改'),401)
test('拒絕刪除',root+'threads/'+thread,None,401,'DELETE')
test('拒絕未知遊戲','feedback/unknown/threads/'+thread,payload(),401)
test('拒絕未登入',root+'threads/'+thread+'-guest',payload(),401,authenticated=False)
blank=''.join(map(chr,[9,10,11,12,13,32,160,5760,*range(8192,8203),8232,8233,8239,8287,12288,65279]))
for game in ['chemistry_arpg','chemistry_rubiks_cube','chemistry_tetris']:
    path='feedback/'+game+'/'
    test('正常新增 '+game,path+'threads/'+thread+'-game',payload(author=' 測試玩家 ',message=' hello 世界 👋\n第二行 '),200)
    test('正常回覆 '+game,path+'replies/'+thread+'-game/valid',payload(),200)
    for field in ['author','message']:
        # 暱稱上限 20，使用短的混合空白；完整集合另驗內容。
        value=' \t\n　\u00a0' if field=='author' else blank
        for section in ['threads/'+thread+'-blank-', 'replies/'+thread+'-game/blank-']:
            test('拒絕混合空白 '+game+' '+field+' '+section,path+section+field,payload(**{field:value}),401)
for game in ['chemistry_arpg','chemistry_rubiks_cube','chemistry_tetris']:
    status,_=request(base+'/feedback/'+game+'/threads.json')
    checks.append({'name':'公開讀取 '+game,'pass':status==200,'status':status})
Path('/private/tmp/firebase-rules-check-result.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
print('RESULT',sum(c['pass'] for c in checks),'/',len(checks))
raise SystemExit(0 if all(c['pass'] for c in checks) else 1)
