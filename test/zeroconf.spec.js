const ewelink = require('../main');
const Zeroconf = require('../src/classes/Zeroconf');
const errors = require('../src/data/errors');

const {
  email,
  password,
  region,
  localIp,
  localIpInvalid,
} = require('./_setup/config/credentials.js');

const { allDevicesExpectations } = require('./_setup/expectations');

describe('zeroconf: save devices to cache file', () => {
  test('can save cached devices file', async () => {
    jest.setTimeout(30000);
    const file = './test/_setup/cache/devices-cache.json';
    const conn = new ewelink({ region, email, password });
    const result = await conn.saveDevicesCache(file);
    expect(typeof result).toBe('object');
    expect(result.status).toBe('ok');
    expect(result.file).toBe(file);
  });

  test('error saving cached devices file', async () => {
    jest.setTimeout(30000);
    const file = '/tmp/non-existent-folder/devices-cache.json';
    const conn = new ewelink({ region, email, password });
    const result = await conn.saveDevicesCache(file);
    expect(typeof result).toBe('object');
    expect(result.error).toContain('ENOENT: no such file or directory');
  });

  test('invalid credentials trying to create cached devices file', async () => {
    const file = '/tmp/non-existent-folder/devices-cache.json';
    const conn = new ewelink({ email: 'invalid', password: 'credentials' });
    const result = await conn.saveDevicesCache(file);
    expect(typeof result).toBe('object');
    expect(result.msg).toBe(errors['406']);
    expect(result.error).toBe(406);
  });
});

describe('zeroconf: save arp table to file', () => {
  test('can save arp table file', async () => {
    jest.setTimeout(30000);
    const file = './test/_setup/cache/arp-table.json';
    const arpTable = await Zeroconf.saveArpTable({
      ip: localIp,
      file,
    });
    expect(typeof arpTable).toBe('object');
    expect(arpTable.status).toBe('ok');
    expect(arpTable.file).toBe(file);
  });

  test('fix mac address for address with -', async () => {
    const someIp = `127.0.0.1`;
    const macWithKebabCase = `01:02-03-0a-0b-0c`;
    
    const fixedAddressed = Zeroconf.fixMacAddresses([{ip: someIp, mac: macWithKebabCase}]);

    expect(fixedAddressed[0].mac).toEqual(`01:02:03:0a:0b:0c`);
  });

  test('error saving arp table file', async () => {
    jest.setTimeout(30000);
    const file = '/tmp/non-existent-folder/arp-table.json';
    const arpTable = await Zeroconf.saveArpTable({
      ip: localIp,
      file,
    });
    expect(typeof arpTable).toBe('object');
    expect(arpTable.error).toContain('ENOENT: no such file or directory');
  });

  test('error saving arp table file with invalid local network', async () => {
    jest.setTimeout(30000);
    const file = './test/_setup/cache/arp-table.json';
    const arpTable = await Zeroconf.saveArpTable({
      ip: localIpInvalid,
      file,
    });
    expect(typeof arpTable).toBe('object');
    expect(arpTable.error).toBe('Error: range must not be empty');
  });
});

describe('zeroconf: load devices to cache file', () => {
  test('can load cached devices file', async () => {
    jest.setTimeout(30000);
    const conn = new ewelink({ region, email, password });
    const devices = await conn.getDevices();
    const devicesCache = await Zeroconf.loadCachedDevices(
      './test/_setup/cache/devices-cache.json'
    );
    expect(typeof devicesCache).toBe('object');
    expect(devicesCache.length).toBe(devices.length);
    expect(devices[0]).toMatchObject(allDevicesExpectations);
  });

  test('error trying to load invalidcached devices file', async () => {
    jest.setTimeout(30000);
    const devicesCache = await Zeroconf.loadCachedDevices('file-not-found');
    expect(typeof devicesCache).toBe('object');
    expect(devicesCache.error).toContain('ENOENT: no such file or directory');
  });
});

describe('zeroconf: load arp table file', () => {
  test('can load arp table file', async () => {
    const arpTable = await Zeroconf.loadArpTable(
      './test/_setup/cache/arp-table.json'
    );
    expect(typeof arpTable).toBe('object');
    expect(arpTable[0]).toMatchObject({
      ip: expect.any(String),
      mac: expect.any(String),
    });
  });

  test('error trying to load invalidcached devices file', async () => {
    const arpTable = await Zeroconf.loadArpTable(
      '/tmp/non-existent-folder/arp-table.json'
    );
    expect(typeof arpTable).toBe('object');
    expect(arpTable.error).toContain('ENOENT: no such file or directory');
  });
});
