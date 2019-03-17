import React, {Component} from 'react';
import { TOKEN_ADDRESS } from './constants';


export default class FaucetLink extends Component {
    
    generateFaucetLink() {

	const faucetIdentity = "0xAAFF3ccaf80f539FC58FCA7BBC747C180C7401d3";
	const faucetPK = "";
	
	const amount = Math.pow(10, 18).toString();
	
	const { sigSender, transitPK } = this.props.sdk.generateLink({privateKey: faucetPK, token: TOKEN_ADDRESS, amount}); 

	const faucetLink = `/#/claim?sig=${sigSender}&pk=${transitPK}&a=${amount}&from=${faucetIdentity}`;
	return faucetLink;
    }
    
    
    render() {
	const faucetLink = this.generateFaucetLink();
	return ( 
		<div style={{paddingTop: 20, paddingBottom: 20}}>
		<h3 style={{paddingBottom: 20}}> You have no account yet </h3>
		<div>
		<div> Follow the link below to get some $ and get new account</div>
		<div style={{marginTop: 10}}>
		<a style={{color: '#0099ff', textDecoration: 'underline'}} href={faucetLink}>Follow this link to get $100</a>
		</div>
	    </div>
		</div>
	);
    }    
}
