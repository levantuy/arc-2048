# Security Audit Baseline Report - arc-2048
**Date**: June 3, 2026  
**Total Vulnerabilities**: 39 (4 HIGH, 22 MODERATE, 13 LOW)

## Vulnerability Inventory

### HIGH SEVERITY (4 vulnerabilities)

| Package | Version Range | Issue | Direct? | Fix Available | Notes |
|---------|---------------|-------|---------|---------------|-------|
| lodash | <=4.17.23 | Prototype Pollution in `_.unset` & `_.omit` (GHSA-xxjr-mmjv-4gpg) | No | Yes - upgrade to >=4.17.24 | Transitive via @nomicfoundation/ignition-core |
| lodash | <=4.17.23 | Code Injection via `_.template` (GHSA-r5fr-rjxr-66jc) | No | Yes - upgrade to >=4.17.24 | Same package, multiple CVEs |
| lodash | <=4.17.23 | Prototype Pollution via array path bypass (GHSA-f23m-r3pf-42rh) | No | Yes - upgrade to >=4.17.24 | Same package, multiple CVEs |
| serialize-javascript | <=7.0.4 | RCE via RegExp.flags & Date.prototype (GHSA-5c6j-r48x-rmvq) | No | Yes - upgrade to >=7.0.5 | Transitive via mocha |
| serialize-javascript | <=7.0.4 | CPU Exhaustion DoS via crafted arrays (GHSA-qj8w-gfj5-8c6v) | No | Yes - upgrade to >=7.0.5 | Same package, multiple CVEs |
| tmp | <=0.2.5 | Arbitrary temp file write via symlink (GHSA-52f5-9888-hmc6) | No | Yes - upgrade to >=0.2.6 | Transitive via solc |
| tmp | <=0.2.5 | Path Traversal via unsanitized prefix/postfix (GHSA-ph9p-34f9-6g65) | No | Yes - upgrade to >=0.2.6 | Same package, multiple CVEs |
| undici | <=6.23.0 | Unbounded decompression chain (GHSA-g9mf-h72j-4rw9) | No | Yes - upgrade to >=6.23.1 | Transitive via hardhat |
| undici | <=6.23.0 | HTTP Request/Response Smuggling (GHSA-2mjp-6q6p-2qxm) | No | Yes - upgrade to >=6.23.1 | Same package |
| undici | <=6.23.0 | Unbounded memory in WebSocket deflate (GHSA-vrm6-8vpv-qv8q) | No | Yes - upgrade to >=6.23.1 | Same package |
| undici | <=6.23.0 | Unhandled exception in WebSocket (GHSA-v9p9-hfj2-hcw8) | No | Yes - upgrade to >=6.23.1 | Same package |
| undici | <=6.23.0 | CRLF Injection via upgrade option (GHSA-4992-7rv2-5pvq) | No | Yes - upgrade to >=6.23.1 | Same package |

### MODERATE SEVERITY (22 vulnerabilities)

| Package | Version Range | Issue | Direct? | Fix Available | Notes |
|---------|---------------|-------|---------|---------------|-------|
| bn.js | <4.12.3 | Infinite loop vulnerability | No | Yes - upgrade to >=4.12.3 | Transitive via ethjs-unit, number-to-bn |
| cookie | <0.7.0 | Out of bounds characters in cookie name/path/domain | No | Yes - upgrade to >=0.7.0 | Transitive via @sentry/node → hardhat |
| esbuild | <=0.24.2 | Website can send requests to dev server & read response | No | Yes - upgrade to >=0.24.3 | Transitive via vite |
| ethjs-unit | >=0.1.3 | Depends on vulnerable bn.js | No | Yes - upgrade ethers/web3-utils | Transitive |
| number-to-bn | * | Depends on vulnerable bn.js | No | Yes - upgrade dependencies | Transitive |
| web3-utils | 1.0.0-beta.8 - 3.0.0-rc.5 | Depends on vulnerable ethjs-unit, number-to-bn | No | Yes | Transitive |
| solidity-coverage | >=0.7.0-beta.0 | Depends on vulnerable packages | No | Yes - upgrade | Transitive via hardhat toolbox |
| @nomicfoundation/hardhat-toolbox | <=6.1.2 | Depends on multiple vulnerable packages | No | Yes - upgrade to >=6.2.0+ | Direct dev dependency (but constrained) |
| @nomicfoundation/hardhat-chai-matchers | <=2.1.2 | Depends on vulnerable packages | No | Yes | Transitive |
| @nomicfoundation/hardhat-ethers | * | Depends on vulnerable ethers, hardhat | No | Yes | Transitive |
| @nomicfoundation/hardhat-ignition | <=0.15.16 | Depends on vulnerable packages | No | Yes | Transitive |
| @nomicfoundation/hardhat-ignition-ethers | * | Depends on vulnerable packages | No | Yes | Transitive |
| @nomicfoundation/hardhat-network-helpers | <=1.1.2 | Depends on vulnerable ethereumjs-util | No | Yes | Transitive |
| @nomicfoundation/hardhat-verify | * | Depends on vulnerable packages | No | Yes | Transitive |
| @typechain/hardhat | >=6.1.0 | Depends on vulnerable ethers, hardhat | No | Yes | Transitive |
| hardhat-gas-reporter | >=2.0.0-alpha.0 | Depends on vulnerable packages | No | Yes | Transitive |
| ethers | >=6.0.0-beta.1 | Depends on vulnerable ws | No | Yes | Transitive |
| ws | 8.0.0 - 8.20.0 | Uninitialized memory disclosure | No | Yes - upgrade to >=8.20.1 | Transitive via ethers |
| uuid | <11.1.1 | Missing buffer bounds check in v3/v5/v6 | No | Yes - upgrade to >=11.1.1 | Transitive via hardhat |
| @nomicfoundation/ignition-core | * | Depends on vulnerable packages | No | Yes | Transitive |
| @ethersproject/abi | 5.0.10 - 5.8.0 | Depends on vulnerable packages | No | Yes | Transitive |
| elliptic | * | Uses risky cryptographic primitive | No | Yes | Transitive via secp256k1 |

### LOW SEVERITY (13 vulnerabilities)

| Package | Version Range | Issue | Direct? | Fix Available | Notes |
|---------|---------------|-------|---------|---------------|-------|
| @ethersproject/abstract-provider | * | Depends on vulnerable packages | No | Yes | Transitive |
| @ethersproject/abstract-signer | * | Depends on vulnerable packages | No | Yes | Transitive |
| @ethersproject/hash | 5.0.6 - 5.8.0 | Depends on vulnerable packages | No | Yes | Transitive |
| @ethersproject/abi | 5.0.10 - 5.8.0 | Depends on vulnerable packages | No | Yes | Transitive |
| @ethersproject/signing-key | <=5.8.0 | Depends on vulnerable elliptic | No | Yes - upgrade hardhat to >=3.7.0 | Transitive |
| @ethersproject/transactions | <=5.8.0 | Depends on vulnerable @ethersproject/signing-key | No | Yes | Transitive |
| ethereumjs-util | >=7.0.3 | Depends on vulnerable packages | No | Yes | Transitive |
| secp256k1 | >=2.0.0 | Depends on vulnerable elliptic | No | Yes | Transitive |
| ethereum-cryptography | 0.1.0 - 0.1.3 | Depends on vulnerable secp256k1 | No | Yes | Transitive |
| Other @ethersproject/* packages | various | Elliptic-related chain | No | Yes | Transitive |
| (4 more minor transitive dependencies) | | | | | |

## Key Observations

1. **All vulnerabilities are transitive** - No direct dependencies need version bumping for vulnerabilities, but direct dependencies pull in vulnerable versions
2. **Main culprits**:
   - `@nomicfoundation/hardhat-toolbox@^6.1.2` pulls in many vulnerable packages
   - `hardhat@^2.28.6` with its dependencies
   - Old ethersproject packages (v5.x) with circular vulnerabilities
   - `mocha`, `solc`, `vite` with their transitive deps

3. **Force fix conflicts**:
   - Many fixes require major version bumps (e.g., hardhat@3.7.0, vite@8.0.16)
   - These are likely breaking changes for the project

## Fix Strategy

1. **Phase 1**: Try safe `npm audit fix` (without force)
2. **Phase 2**: Identify which packages need forced upgrades
3. **Phase 3**: Test compatibility with hardhat 3.x and vite 8.x if needed
4. **Phase 4**: Target remaining vulnerabilities with overrides/resolutions as fallback
