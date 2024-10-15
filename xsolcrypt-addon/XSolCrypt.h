// #ifndef _XSolCrypt_h_
// #define _XSolCrypt_h_

#ifndef XSOLCRYPT_H
#define XSOLCRYPT_H

#include <string>
#include <vector>

class XSolCrypt
{
		std::string KEY_DEFAULT;		
		const static unsigned char DEF_KEY[];
		const static unsigned char CONST_KEY[];
		
		std::vector<std::string> KEYS;
	
		std::string GetLastKey();
		std::string GetKey(int i);
	
	public:
		XSolCrypt();

		void AddKey(const std::string& k);	
		void ClearKeys();
		
		std::string Encode(const std::string& f);
		std::string Decode(const std::string& f);
};

#endif
