import { addressToBytes32 } from './utils';
import { utils } from 'ethers';


function buildCreate2Address(creatorAddress, saltHex, byteCode) {

    const byteCodeHash = utils.keccak256(byteCode);
    return `0x${utils.keccak256(`0x${[
	'ff',
	creatorAddress,
	saltHex,
	byteCodeHash
    ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`.toLowerCase();
}


export const computeAddress = (managementKey) => {
    const factoryAddress = "0x911bE9fC0dE67AAF68EBdb94c1bd04311DD56fE7";
    const libAddress = '0x1D3Cc0F872F477Dd83Ce860fA163a67c94f90261'.slice(2);
    const pubKey = utils.hexlify(addressToBytes32(managementKey));


    const bytecode =`0x3d602d80600a3d3981f3363d3d373d3d3d363d73${libAddress}5af43d82803e903d91602b57fd5bf3`;
    const address = buildCreate2Address(
	factoryAddress,
	pubKey,
	bytecode
    );
    return address;
}
